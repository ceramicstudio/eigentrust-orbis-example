import { OrbisDB } from "@useorbis/db-sdk";
import { OrbisKeyDidAuth } from "@useorbis/db-sdk/auth";

const ENV_ID = process.env.NEXT_PUBLIC_ENV_ID;
const ASSERTION_TABLE = process.env.NEXT_PUBLIC_ASSERTION_TABLE;
const CONTEXT_ID = process.env.NEXT_PUBLIC_CONTEXT_ID;
const news_agent = process.env.NEWS_AGENT_SEED;
const aave_agent = process.env.AAVE_AGENT_SEED;
const dune_agent = process.env.DUNE_AGENT_SEED;
const compound_agent = process.env.COMPOUND_AGENT_SEED;

export async function POST(request: Request) {
  try {
    const req = await request.json();
    const name = req.name;
    const trust = req.trust;

// get corresponding DIDs for each agent
    //@ts-ignore 
    const news_agent_did =(await (await OrbisKeyDidAuth.fromSeed(news_agent!)).authenticateDid()).did._id;
    //@ts-ignore 
    const aave_agent_did =(await (await OrbisKeyDidAuth.fromSeed(aave_agent!)).authenticateDid()).did._id;
    //@ts-ignore 
    const dune_agent_did =(await (await OrbisKeyDidAuth.fromSeed(dune_agent!)).authenticateDid()).did._id;
    //@ts-ignore 
    const compound_agent_did =(await (await OrbisKeyDidAuth.fromSeed(compound_agent!)).authenticateDid()).did._id;

    const orbis = new OrbisDB({
      ceramic: {
        gateway: "https://ceramic-orbisdb-mainnet-direct.hirenodes.io/",
      },
      nodes: [
        {
          gateway: "https://studio.useorbis.com",
          env: ENV_ID,
        },
      ],
    });
    const scoresByAgent: { [key: string]: any[] } = {
      news_agent: [],
      aave_agent: [],
      dune_agent: [],
      compound_agent: [],
    };
    // loop through trust array and organize by agent
    for (const trustItem of trust) {
      const from = trustItem.from;
      //remove the from key from the object
      delete trustItem.from;
      switch (from) {
        case "news_agent":
          scoresByAgent.news_agent.push(trustItem);
          break;
        case "aave_agent":
          scoresByAgent.aave_agent.push(trustItem);

          break;
        case "dune_agent":
          scoresByAgent.dune_agent.push(trustItem);

          break;
        case "compound_agent":
          scoresByAgent.compound_agent.push(trustItem);

          break;
      }
    }
    console.log(scoresByAgent);
    const returnArray = [];
    // loop through agents and store trust in ceramic
    for (const agent in scoresByAgent) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const seed =
        agent === "news_agent"
          ? news_agent
          : agent === "aave_agent"
          ? aave_agent
          : agent === "dune_agent"
          ? dune_agent
          : compound_agent;

      if (!seed) {
        return Response.json(
          {
            error: `Agent seed not found for ${agent}`,
          },
          { status: 500 }
        );
      }
      const auth = await OrbisKeyDidAuth.fromSeed(seed);
      await orbis.connectUser({ auth });
      await orbis.getConnectedUser();

      // if scoresByAgent[agent] is empty, skip
      if (scoresByAgent[agent].length >  0) {

      const updatequery = orbis
        .insert(ASSERTION_TABLE!)
        .value({
          trustworthiness: scoresByAgent[agent],
          issued: new Date().toISOString(),
          agentId:
            name === "news_agent"
              ? news_agent_did
              : name === "aave_agent"
              ? aave_agent_did
              : name === "dune_agent"
              ? dune_agent_did
              : compound_agent_did,
        })
        .context(CONTEXT_ID!);
      const result = await updatequery.run();
      if (result.content) {
        returnArray.push(result);
      }
      await orbis.disconnectUser();
    }
  }

    return Response.json({ returnArray }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: `Something went wrong: ${error}` },
      { status: 500 }
    );
  }
}
