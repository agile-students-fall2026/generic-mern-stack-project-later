import assert from 'node:assert/strict'
import { votes } from '../src/data/demoData.js'
import { getPlaceVotingData, setPlaceVote, getRankedCityPlaces } from '../src/data/mockDataLayer.js'
const initial = structuredClone(votes)
assert.deepEqual(getPlaceVotingData('p_6').tally, {'must-go':2,down:1,pass:0})
assert.equal(setPlaceVote('p_6','pass').ok,true)
assert.deepEqual(getPlaceVotingData('p_6').tally, {'must-go':1,down:1,pass:1})
assert.equal(getPlaceVotingData('p_6').value,'pass')
assert.deepEqual(getRankedCityPlaces('c_paris').map(p=>p.id),['p_8','p_6','p_7'])
setPlaceVote('p_6','pass')
assert.equal(votes.length,initial.length)
assert.equal(setPlaceVote('p_8','must-go').ok,true)
assert.equal(votes.length,initial.length+1)
setPlaceVote('p_8','down')
assert.equal(votes.length,initial.length+1)
const before=structuredClone(votes)
for(const [id,value] of [['p_2','down'],['p_9','pass'],['missing','must-go'],['p_6','hard-pass']]) {
 assert.equal(setPlaceVote(id,value).ok,false)
 assert.deepEqual(votes,before)
}
votes.push({id:'duplicate', savedPlaceId:'sp_6',userId:'u_1',value:'down'})
setPlaceVote('p_6','must-go')
assert.equal(votes.filter(v=>v.savedPlaceId==='sp_6'&&v.userId==='u_1').length,1)
assert.deepEqual(votes.filter(v=>v.userId!=='u_1'),initial.filter(v=>v.userId!=='u_1'))
console.log('PASS: initial counts, vote replacement, selection, ranking, repeat click, new vote, switching, rejected writes, duplicate cleanup, other users preserved.')
