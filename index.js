import * as d3 from 'd3';
import dataset from './dataset/data.json' assert { type: "json" };

import randomColorsArray from './colors';

const dimensions = {
  width: 16000,
  height: 700,
  margin: {
    top: 20,
    right: 20,
    bottom: 50,
    left: 70
  }
}

dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

const rankingDates = Object.keys(dataset)

const limittedDates = rankingDates.slice(0, 1300)

console.log(limittedDates)

const limittedDataset = []
limittedDates.forEach(date => { limittedDataset.push(dataset[date].map(d => ({ranking: d.ranking, player: JSON.parse(d.player.replace(/'/g, "\"")).fullName, points: d.points, rankedAt: d.rankedAt}))) })
console.log(limittedDataset)
const allPlayers = [...new Set(limittedDataset.reduce((prev, curr) => prev.concat(curr), []).map(rank => rank.player))]


// The goal is to have array of arrays of pairs [date, rank].
// So something like [[[01-01-1993, 9], [08-01-1993, 10]], [[22-04-1994, 2], [29-04-1994, 1], [06-05-1994, 2]...]...]
// Based on that lines on a Bump chart will be drawn.
// First step is to create the array of pairs for all dates of the dataset.
// When player was not ranked top 10 in that date - put null
// Then gather in arrays all dates in between which there is no null rank
// After filtering out all null ranked dates, the top-10 series for a player should remain
const getAllTop10SeriesForAPlayer = (dataset, player) => {
  const rankingEntries = [];

  dataset.forEach((ranking, i) => {
    const playersEntry = ranking.find(rank => rank.player === player)
    rankingEntries.push([limittedDates[i], playersEntry ? playersEntry.ranking : null])
  })

  const playersSeries = []

  let buff = []
  rankingEntries.forEach( (entry)  => {
    if (entry[1] !== null) {
      buff.push(entry)
    } else if (entry[1] === null && buff.length) {
      playersSeries.push(buff)
      buff = []
    }
  })

  return playersSeries
}

const rankAccessor = (d) => Number(d["ranking"])
const dateAccessor = (d) => new Date(d["rankedAt"])

const yScale = d3.scaleBand().domain([10,9,8,7,6,5,4,3,2,1]).range([dimensions.boundedHeight, 0])
const xScale = d3.scaleTime()
  .domain(d3.extent(Object.values(limittedDates)).map(e => new Date(e)))
  .range([0, dimensions.boundedWidth])

const colorScale = d3.scaleOrdinal().domain(allPlayers).range(randomColorsArray)

const line = d3.line()
  .x(d => xScale(new Date(d[0])))
  .y(d => yScale(Number(d[1])))

const wrapper = d3.select("#wrapper")
  .append("svg")
  .attr("width", dimensions.width)
  .attr("height", dimensions.height)


const bounds = wrapper.append("g").style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`)

const allPlayersSeries = allPlayers.map(
  player => ({ name: player, series: getAllTop10SeriesForAPlayer(limittedDataset, player) })
)

allPlayersSeries.forEach(player => {
  player.series.filter(serie => serie.length > 1).forEach(serie => {
  console.log(serie)
  bounds.append("path")
    .attr("d", line(serie))
    .attr("stroke", colorScale(player.name))
    .attr("stroke-width", "3")
    .attr("fill","transparent")
})
})


limittedDataset.forEach(ranking => {
  ranking.slice(0, 10).forEach(player => {
    bounds.append("circle")
      .attr("cx", xScale(dateAccessor(player)))
      .attr("cy", yScale(rankAccessor(player)))
      .attr("r", "6")
      .attr("fill", colorScale(player.player))
      .attr("data-player", JSON.stringify(player)) // for debugging only
  })
})
