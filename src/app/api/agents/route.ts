import { OrbisKeyDidAuth } from "@useorbis/db-sdk/auth";




const news_agent = process.env.NEWS_AGENT_SEED;
const aave_agent = process.env.AAVE_AGENT_SEED;
const dune_agent = process.env.DUNE_AGENT_SEED;
const compound_agent = process.env.COMPOUND_AGENT_SEED;

export async function GET(request: Request) {
  try {

// get corresponding DIDs for each agent
    //@ts-ignore 
    const news_agent_did =(await (await OrbisKeyDidAuth.fromSeed(news_agent!)).authenticateDid()).did._id;
    //@ts-ignore 
    const aave_agent_did =(await (await OrbisKeyDidAuth.fromSeed(aave_agent!)).authenticateDid()).did._id;
    //@ts-ignore 
    const dune_agent_did =(await (await OrbisKeyDidAuth.fromSeed(dune_agent!)).authenticateDid()).did._id;
    //@ts-ignore 
    const compound_agent_did =(await (await OrbisKeyDidAuth.fromSeed(compound_agent!)).authenticateDid()).did._id;

   const agentDids = {
            news_agent: news_agent_did,
            aave_agent: aave_agent_did,
            dune_agent: dune_agent_did,
            compound_agent: compound_agent_did,
        };

    return Response.json(agentDids, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: `Something went wrong: ${error}` },
      { status: 500 }
    );
  }
}
