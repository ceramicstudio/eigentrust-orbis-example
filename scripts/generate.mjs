import {OrbisKeyDidAuth} from "@useorbis/db-sdk/auth"

const news_agent = OrbisKeyDidAuth.generateSeed("hex")
const aave_agent = OrbisKeyDidAuth.generateSeed("hex")
const dune_agent = OrbisKeyDidAuth.generateSeed("hex")
const compound_agent = OrbisKeyDidAuth.generateSeed("hex")

console.log({
    news_agent,
    aave_agent,
    dune_agent,
    compound_agent
})