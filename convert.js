import { dirname, relative } from 'path'
import {writeFile} from 'fs';
import { fileURLToPath } from 'url';
import csv from 'csvtojson'

const __dirname = dirname(fileURLToPath(import.meta.url));

const csvFilePath = relative(__dirname, 'dataset/data.csv')

console.log(csvFilePath)

console.log("Converting CSV file to JSON...")
const jsonArray = await csv().fromFile(csvFilePath)

const rankingDates = new Set(jsonArray.map(entry => entry.rankedAt))

let top10perRanking = {};
rankingDates.forEach((date) => {
  top10perRanking[date] = jsonArray.filter(entry => entry.rankedAt === date).filter(rankEntry => Number(rankEntry.ranking) <= 10)
})

console.log("Top ten for each ranking encapsulated.")


console.log("Writing data to JSON file...")
writeFile(relative(__dirname, 'dataset/data.json'), JSON.stringify(top10perRanking), (error) => {
  if (error) { console.log("Error while writing to file: ", error); return; }

  console.log("Successfully written data to file data.json")
})
