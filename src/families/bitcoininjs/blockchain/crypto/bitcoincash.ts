// from https://github.com/LedgerHQ/xpub-scan/blob/master/src/actions/deriveAddresses.ts

import * as bjs from "bitcoinjs-lib";
import { ICrypto, DerivationMode } from "./types";
import * as bch from "bitcore-lib-cash";
import bchaddr from "bchaddrjs";

// a mock explorer class that just use js objects
class BitcoinCash implements ICrypto {
  network: any;
  DerivationMode: DerivationMode = {
    BCH: "BCH",
  };

  constructor({ network }) {
    this.network = network;
  }

// Based on https://github.com/go-faast/bitcoin-cash-payments/blob/54397eb97c7a9bf08b32e10bef23d5f27aa5ab01/index.js#L63-L73

getLegacyBitcoinCashAddress(
    xpub: string,
    account: number,
    index: number,
  ): string {
    const CASH_ADDR_FORMAT = bch.Address.CashAddrFormat;
    const node = new bch.HDPublicKey(xpub);
    const child = node.derive(account).derive(index);
    const address = new bch.Address(child.publicKey, bch.Networks.livenet);
    const addrstr = address.toString(CASH_ADDR_FORMAT).split(":");
    if (addrstr.length === 2) {
      return bchaddr.toCashAddress(bchaddr.toLegacyAddress(addrstr[1]));
    } else {
      throw new Error("Unable to derive cash address for " + address);
    }
  }

  // get address given an address type
  getAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number,
  ): string {
    return this.getLegacyBitcoinCashAddress(xpub, account, index);
  }

  // infer address type from its syntax
  //
  // TODO: improve the prefix matching: make the expected prefix
  // correspond to the actual type (currently, a `ltc1` prefix
  // could match a native Bitcoin address type for instance)
  getDerivationMode(address: string) {
    return this.DerivationMode.BCH;
  }

  getPsbt() {
    return new bjs.Psbt({ network: this.network });
  }
}

export default BitcoinCash;
