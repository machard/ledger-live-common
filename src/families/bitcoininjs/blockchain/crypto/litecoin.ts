import * as bjs from "bitcoinjs-lib";
import * as bip32 from "bip32";
import { ICrypto, DerivationMode } from "./types";
//Todo copy paste from bitcoin.ts. we can merge them later
class Litecoin implements ICrypto {
  network: any;
  DerivationMode: DerivationMode = {
    LEGACY: "Legacy",
    SEGWIT: "SegWit",
  };

  constructor({ network }) {
    this.network = network;
  }

  getLegacyAddress(xpub: string, account: number, index: number): string {
    const { address } = bjs.payments.p2pkh({
      pubkey: bip32.fromBase58(xpub, this.network).derive(account).derive(index)
        .publicKey,
      network: this.network,
    });
    return String(address);
  }

  getSegWitAddress(xpub: string, account: number, index: number): string {
    const { address } = bjs.payments.p2sh({
      redeem: bjs.payments.p2wpkh({
        pubkey: bip32
          .fromBase58(xpub, this.network)
          .derive(account)
          .derive(index).publicKey,
        network: this.network,
      }),
    });
    return String(address);
  }

  getAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number,
  ): string {
    switch (derivationMode) {
      case this.DerivationMode.LEGACY:
        return this.getLegacyAddress(xpub, account, index);
      case this.DerivationMode.SEGWIT:
        return this.getSegWitAddress(xpub, account, index);
    }
    throw new Error("Should not be reachable");
  }

  getDerivationMode(address: string) {
    if (address.match("^(3|2|M).*")) {
      return this.DerivationMode.SEGWIT;
    } else if (address.match("^(1|n|m|L).*")) {
      return this.DerivationMode.LEGACY;
    } else {
      throw new Error(
        "INVALID ADDRESS: ".concat(address).concat(" is not a valid address"),
      );
    }
  }

  getPsbt() {
    return new bjs.Psbt({ network: this.network });
  }
}

export default Litecoin;
