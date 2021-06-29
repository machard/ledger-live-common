import Storage from "../storage/mock";
import Explorer from "../explorer/ledger.v3.2.4";
import Crypto from "../crypto/bitcoin";
import Wallet from "../wallet";
import path from "path";
import coininfo from "coininfo";
import { toMatchFile } from "jest-file-snapshot";
import { orderBy } from "lodash";
import Bitcoin from "../crypto/bitcoin";
import BitcoinCash from "../crypto/bitcoincash";
import Litecoin from "../crypto/litecoin";

const startLogging = (emitters) => {
  emitters.forEach((emitter) =>
    emitter.emitter.on(emitter.event, (data) => {
      if (data.type === emitter.type) {
        console.log(emitter.event, JSON.stringify(data, null, 2));
      }
    })
  );
};
const stopLogging = (emitters) => {
  emitters.forEach((emitter) => emitter.removeAllListeners());
};

expect.extend({ toMatchFile });

describe("integration sync bitcoin mainnet / ledger explorer / mock storage", () => {
  const walletDatasets = [
    {
      xpub:
        "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz", // 3000ms
      addresses: 15,
      balance: 12678243,
      network: coininfo.bitcoin.main.toBitcoinJS(),
      coin: "btc",
    },
    {
      xpub:
        "xpub6D4waFVPfPCpRvPkQd9A6n65z3hTp6TvkjnBHG5j2MCKytMuadKgfTUHqwRH77GQqCKTTsUXSZzGYxMGpWpJBdYAYVH75x7yMnwJvra1BUJ", // 5400ms
      addresses: 506,
      balance: 166505122,
      network: coininfo.bitcoin.main.toBitcoinJS(),
      coin: "btc",
    },
    {
      xpub:
        "xpub6D4waFVPfPCpRvPkQd9A6n65z3hTp6TvkjnBHG5j2MCKytMuadKgfTUHqwRH77GQqCKTTsUXSZzGYxMGpWpJBdYAYVH75x7yMnwJvra1BUJ", // 5400ms
      addresses: 506,
      balance: 166505122,
      network: coininfo.bitcoin.main.toBitcoinJS(),
      coin: "btc",
    },
    {
      xpub:
        "xpub6BvNdfGcyMB9Usq88ibXUt3KhbaEJVLFMbhTSNNfTm8Qf1sX9inTv3xL6pA6KofW4WF9GpdxwGDoYRwRDjHEir3Av23m2wHb7AqhxJ9ohE8",
      addresses: 16,
      balance: 360615,
      network: coininfo.bitcoincash.main.toBitcoinJS(),
      coin: "bch",
    },
    {
      xpub:
        "Ltub2ZgHGhWdGi2jacCdKEy3qddYxH4bpDtmueiPWkG8267Z9K8yQEExapyNi1y4Qp7f79JN8468uE9V3nizpPU27WEDfXrtqpkp84MyhhCDTNk",
      addresses: 5,
      balance: 87756,
      network: coininfo.litecoin.main.toBitcoinJS(),
      coin: "ltc",
    },
    {
      xpub:
        "xpub6CThYZbX4PTeA7KRYZ8YXP3F6HwT2eVKPQap3Avieds3p1eos35UzSsJtTbJ3vQ8d3fjRwk4bCEz4m4H6mkFW49q29ZZ6gS8tvahs4WCZ9X", // 138sec,
      addresses: 9741,
      balance: 0,
      network: coininfo.bitcoin.main.toBitcoinJS(),
      coin: "btc",
    },
  ];

  walletDatasets.forEach((dataset) =>
    describe(`xpub ${dataset.xpub}`, () => {
      let storage = new Storage();
      let wallet = new Wallet({
        storage,
        explorer: new Explorer({
          explorerURI: `https://explorers.api.vault.ledger.com/blockchain/v3/${dataset.coin}`,
        }),
        //TODO refactoring factory design pattern needed
        crypto: dataset.coin === "bch" ? new BitcoinCash({network: dataset.network}): dataset.coin === "ltc" ? new Litecoin({network: dataset.network}) :new Bitcoin({network: dataset.network}),
        xpub: dataset.xpub,
      });

      beforeAll(() => {
        startLogging([
          { emitter: wallet, event: "syncing", type: "address" },
          { emitter: wallet.explorer, event: null },
        ]);
      });
      afterAll(() => {
        stopLogging([wallet, wallet.explorer]);
      });

      it(
        "should sync from zero correctly",
        async () => {
          await wallet.sync();

          const truthDump = path.join(
            __dirname,
            "data",
            "sync",
            `${dataset.xpub}.json`
          );

          expect(
            await storage.toString((txs) =>
              orderBy(txs, [
                "derivationMode",
                "account",
                "index",
                "block.height",
                "id",
              ])
            )
          ).toMatchFile(truthDump);
          expect(await wallet.getWalletBalance()).toEqual(dataset.balance);
          const addresses = await wallet.getWalletAddresses();
          expect(addresses.length).toEqual(dataset.addresses);
        },
        // github so slow
        15 * 60 * 1000
      );
    })
  );
});
