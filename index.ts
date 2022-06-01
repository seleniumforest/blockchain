import { sha256 } from "js-sha256";
// @ts-ignore
import * as transfers from "./testdata.json";


interface Blockchain {
    blocks: Block[],
    difficulty: number
}

interface Block {
    height: number,
    datetime: Date,
    transfers: Transfer[],
    prevBlockHash: string,
    nonce: number
    hash: string
}

interface OutputTransaction {
    to: string,
    amount: number
}

interface InputTransaction {
    from: string,
    amount: number
}

interface Transfer {
    inputs: InputTransaction[],
    outputs: OutputTransaction[]
}

const isValidTransfer = (transfer: Transfer): boolean => {
    //in bitcoin, sum(inputs) should be equal to sum(outputs)
    //when you have 100 btc and want to send 10 btc, 
    //then you create 2 outputs - one 10 btc for reciever, second - for yourself back,
    //so you have input for 90 btc you can use as an input for another transfers in future
    let inputsSum = transfer.inputs.map(x => x.amount).reduce((acc, cur) => acc + cur, 0);
    let outputsSum = transfer.outputs.map(x => x.amount).reduce((acc, cur) => acc + cur, 0);

    return inputsSum == outputsSum;
}

const getGenesisBlock = (difficulty): Block => {
    let block: Block = {
        height: 0,
        transfers: [],
        datetime: new Date(),
        prevBlockHash: "",
        nonce: 0,
        hash: ""
    };

    return mineBlock(block, difficulty);
}

const mineBlock = (block: Block, difficulty: number): Block => {
    let blockHash = block.hash;
    let nonce = 0;
    let difficultyHashStart = "0".repeat(difficulty);
    while (!blockHash.startsWith(difficultyHashStart)) {
        blockHash = sha256(nonce + sha256(JSON.stringify(block)));
        nonce++;
    }

    return {
        ...block,
        hash: blockHash,
        nonce
    }
}

const addBlockToBlockchain = (blockchain: Blockchain, transfers: Transfer[]): Blockchain => {
    //throw away transfers where sum(inputs) !== sum(outputs)
    let validTransfers = transfers.filter(x => isValidTransfer(x));
    let lastBlock = blockchain.blocks[blockchain.blocks.length - 1];
    let newBlock: Block = {
        height: lastBlock.height + 1,
        datetime: new Date(),
        transfers: validTransfers,
        prevBlockHash: lastBlock.hash,
        nonce: 0,
        hash: ""
    };
    let mined = mineBlock(newBlock, blockchain.difficulty)

    return {
        ...blockchain,
        blocks: [
            ...blockchain.blocks,
            mined
        ]
    }
}

(function (difficulty: number) {
    let genesisBlock = getGenesisBlock(difficulty);
    //testdata.json
    let fakeTransfers = transfers as Transfer[];
    let blockchain: Blockchain = {
        blocks: [genesisBlock],
        difficulty: difficulty
    };

    //first object is valid tx with 2 inputs and 2 outputs
    //second is valid with 1 input and 3 outputs
    //the last is invalid because 90 btcs are will be lost, so we need to filter this transfer 
    fakeTransfers.forEach(ft => {
        blockchain = addBlockToBlockchain(blockchain, [ft]);
        let lastBlock = blockchain.blocks[blockchain.blocks.length - 1];

        console.log(`LAST BLOCK №${lastBlock.height}-------------------`)
        console.log(JSON.stringify(lastBlock, null, 4));
    })
})(4);