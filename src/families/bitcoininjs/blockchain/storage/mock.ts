import { IStorage, TX } from "./types";
import { findLast, filter, uniq, orderBy, uniqBy } from "lodash";
import fs from "fs";

// a mock storage class that just use js objects
class Mock implements IStorage {
  txs: TX[] = [];

  async getLastTx(txFilter) {
    return findLast(this.txs, txFilter);
  }

  async appendAddressTxs(txs: TX[]) {
    const lastLength = this.txs.length;

    this.txs = uniqBy(
      this.txs.concat(txs),
      (tx) => `${tx.derivationMode}-${tx.account}-${tx.index}-${tx.id}`
    );

    return this.txs.length - lastLength;
  }

  async getUniquesAddresses(addressesFilter) {
    return uniqBy(
      filter(this.txs, addressesFilter).map((tx) => ({
        address: tx.address,
        derivationMode: tx.derivationMode,
        account: tx.account,
        index: tx.index,
      })),
      "address"
    );
  }

  async getDerivationModeUniqueAccounts(derivationMode: string) {
    return uniq(filter(this.txs, { derivationMode }).map((tx) => tx.account));
  }

  async toString(sort = (txs) => txs) {
    return JSON.stringify(sort(this.txs), null, 2);
  }
  async load(file: string) {
    //
    this.txs = JSON.parse(fs.readFileSync(file).toString());
  }
}

export default Mock;
