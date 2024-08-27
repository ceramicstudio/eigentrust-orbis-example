# Agent Reputation Example using EigenTrust and OrbisDB

This demo emulates the following flow:

1. OrbisDB to store peer-to-peer trust assertions agents are assigning each other
2. EigenTrust (using the OpenRank SDK) to calculate global trust scores across the network of agents
3. SwarmZero's [Agent UI](https://github.com/hivenetwork-ai/hive-agent-ui) and several of their example agent names

In short, this shows how AI agent networks can utilize Ceramic to allow individual autonomous agents to self-authenticate using dedicated private keys, write peer rating assertions for other agents given their performance across arbitrary data points (like "accuracy") to save on Ceramic, and use OpenRank (using the EigenTrust algorithm) to consume those data points and calculate global trust scores.

## Getting Started

1. First, install the dependencies:

```
yarn install
```

2. Second, make a copy of the [.env.example](.env.example) file, rename it to `.env` and update the values accordingly:

```bash
cp .env.example .env
```

3. Create a WalletConnect project ID by visiting https://cloud.walletconnect.com/sign-in, create a new project (with a name of your choosing and the `App` type selected), and copy the `Project ID` key once available. 

Once copied, assign it to `NEXT_PUBLIC_PROJECT_ID` in your new .env file

4. Visit the [Orbis Studio](https://studio.useorbis.com/) and create a free account if you do not already have one. 

First, set up a new context (required to use a shared instance). You can call it whatever you like. Assign the resulting string value (starting with "k") to `NEXT_PUBLIC_CONTEXT_ID` in your .env file.

Next, copy the value you see under "Environment ID" and assign it to `NEXT_PUBLIC_ENV_ID` in your .env file.

Finally, run the following to generate random private seeds that your agents will use to self-authenticate onto the network and write data:

```bash
npm run generate
```

You should see the seed strings appear in your console. Copy each string and assign it to the remaining missing variables. For example, the value for `news_agent` should be assigned to `NEWS_AGENT_SEED` in your .env file, and so on.

5. A schema has already been created for you for this demo and left as a default value in your .env file (assigned to `NEXT_PUBLIC_ASSERTION_TABLE`), so no action is needed here. For reference, you can view the [JSON definition](definition.json) and a sample [deploy script](example-deployscript.ts) showing how to deploy complex definitions using the OrbisDB SDK.

6. You will need to start up your Python server next:

```bash
# first create and activate a virtual environment
cd server
python3 -m venv myenv
source myenv/bin/activate

# install deps
pip install -r requirements.txt

# start server
python3 server.py 

```

7. Finally, in a new terminal, run the NextJS app:

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about OrbisDB please visit the following links

- [OrbisDB Overview](https://developers.ceramic.network/docs/orbisdb/overview) 
- [OrbisDB SDK](https://developers.ceramic.network/docs/orbisdb/orbisdb-sdk) 
- [OrbisDB Website](https://useorbis.com/) 
