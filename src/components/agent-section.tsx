"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "react-toastify";
import useStore from "../../store";
import { useAccount } from "wagmi";
import { Divide } from "lucide-react";

export interface TrustType {
  from: string;
  scope: string;
  level: number;
  reason?: string[];
}

interface Trustworthiness {
  i: string;
  v: number;
}

interface GlobalScores {
  [key: string]: Trustworthiness[][];
}

interface GlobalScoresPieChartsProps {
  data: GlobalScores;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

const scoreTypes = ["Quality", "Communication", "Accuracy"];

const GlobalScoresPieCharts: React.FC<GlobalScoresPieChartsProps> = ({
  data,
}) => {
  const renderPieChart = (
    key: string,
    trustworthinessArray: Trustworthiness[][]
  ) => {
    const chartData = trustworthinessArray[0].map((item) => ({
      name: item.i,
      value: item.v,
    }));

    return (
      <div
        key={key}
        className="bg-white rounded-lg flex flex-col items-center min-h-[550px] w-full"
      >
        <h2 className="text-xl font-bold mb-4 text-center">{key}</h2>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <>
      {Object.entries(data).map(([key, value]) => renderPieChart(key, value))}
    </>
  );
};

export default function AgentSection() {
  const [viewScores, setViewScores] = useState(false);
  const [globalScores, setGlobalScores] = useState<GlobalScores>({});
  const { address } = useAccount();
  const [newsTrust, setNewsTrust] = useState<TrustType[]>([]);
  const [aaveTrust, setAaveTrust] = useState<TrustType[]>([]);
  const [duneTrust, setDuneTrust] = useState<TrustType[]>([]);
  const [compoundTrust, setCompoundTrust] = useState<TrustType[]>([]);

  const { orbis, setAuth } = useStore();

  const createRandomScores = (agentName: string) => {
    try {
      // create random scores from other agents
      for (const agent of agents) {
        if (agent.name !== agentName) {
          let trust;
          const scoreArray = [];
          for (const scoreType of scoreTypes) {
            console.log(agent.name, scoreType);
            const min = 1;
            const max = 100;
            const randomScore =
              Math.floor(Math.random() * (max - min + 1)) + min;
            const reasons = ["Random Reason 1", "Random Reason 2"];
            trust = {
              from: agentName,
              scope: scoreType,
              level: randomScore,
              reason: reasons,
            };
            scoreArray.push(trust);
          }
          switch (agent.name) {
            case "news_agent":
              const newerTrust: TrustType[] = [...newsTrust, ...scoreArray];
              setNewsTrust(newerTrust);
              break;
            case "aave_agent":
              const newAaveTrust: TrustType[] = [...aaveTrust, ...scoreArray];
              setAaveTrust(newAaveTrust);
              break;
            case "dune_agent":
              const newDuneTrust: TrustType[] = [...duneTrust, ...scoreArray];
              setDuneTrust(newDuneTrust);
              break;
            case "compound_agent":
              const newCompoundTrust: TrustType[] = [
                ...compoundTrust,
                ...scoreArray,
              ];
              setCompoundTrust(newCompoundTrust);
              break;
          }
        }
      }
      console.log(newsTrust, aaveTrust, duneTrust, compoundTrust);
    } catch (error) {
      console.log(error);
    }
  };

  const getAllRecords = async () => {
    try {
      await orbis.getConnectedUser();
      const recordsQuery = await orbis
        .select()
        .raw(`SELECT * FROM ${process.env.NEXT_PUBLIC_ASSERTION_TABLE}`)
        .run();
      console.log(recordsQuery);

      // get calculated scores from port 8080
      const scores = await fetch("http://localhost:8080", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // get agent dids
      const res = await fetch("/api/agents", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = (await res.json()) as { [key: string]: string };
      const scoresData = (await scores.json()) as GlobalScores;
      for (const [key, value] of Object.entries(scoresData)) {
        // value is an array of objects with i and v keys
        for (const trustworthinessArray of value) {
          // trustworthinessArray is an array of objects with i and v keys
          for (const trustworthiness of trustworthinessArray) {
            // replace the i key with the agent name
            const agentName = Object.keys(result).find(
              (k) => result[k] === trustworthiness.i
            );
            if (agentName) {
              trustworthiness.i = agentName;
            }
          }
        }
      }
      setGlobalScores(scoresData);
      console.log(scoresData);
    } catch (error) {
      console.log(error);
    }
  };

  const handleOnSubmit = async (name: string) => {
    try {
      console.log(name);

      let trust: TrustType[];
      switch (name) {
        case "news_agent":
          trust = newsTrust;
          break;
        case "aave_agent":
          trust = aaveTrust;
          break;
        case "dune_agent":
          trust = duneTrust;
          break;
        case "compound_agent":
          trust = compoundTrust;
          break;
        default:
          return;
      }

      const data = {
        name,
        trust,
      };

      console.log(data);

      const res = await fetch("/api/orbis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      console.log(result);

      // reset trust
      name === "news_agent"
        ? setNewsTrust([])
        : name === "aave_agent"
        ? setAaveTrust([])
        : name === "dune_agent"
        ? setDuneTrust([])
        : setCompoundTrust([]);
    } catch (error) {
      console.log(error);
      toast.warn("Error occured while sending chat.");
    }
  };

  const agents = [
    {
      id: 1,
      name: "news_agent",
      avatar:
        "https://st2.depositphotos.com/6789684/12262/v/450/depositphotos_122620866-stock-illustration-illustration-of-flat-icon.jpg",
    },
    {
      id: 2,
      name: "aave_agent",
      avatar: "https://cryptologos.cc/logos/aave-aave-logo.png",
    },
    {
      id: 3,
      name: "dune_agent",
      avatar:
        "https://pbs.twimg.com/profile_images/1641375897658748928/tPBBdDui_400x400.jpg",
    },
    {
      id: 4,
      name: "compound_agent",
      avatar:
        "https://a-us.storyblok.com/f/1016390/2000x2000/0a4deb5f84/compound-finance.png",
    },
  ];

  useEffect(() => {
    if (address) {
      setAuth(window.ethereum);
      getAllRecords();
    }
    return () => {
      setGlobalScores({});
    };
  }, [address]);

  return (
    <div className="space-y-2 md:space-y-4 max-w-5xl w-full flex-grow">
      <button
        className="bg-[#d36a1f] text-white p-2 rounded-md mt-4 margin-auto"
        onClick={() => setViewScores(!viewScores)}
      >
        {viewScores ? "View Agents" : "View Scores"}
      </button>
      <div className="max-w-5xl w-full grid grid-cols-4 md:grid-cols-2 gap-4">
        {!viewScores ? (
          <>
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white rounded-lg flex flex-col items-center min-h-[550px]"
              >
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-24 h-24 rounded-full mt-4"
                />
                <h3 className="text-xl font-bold mt-4 mb-4">{agent.name}</h3>
                <label className="text-sm font-semibold">Trustworthiness</label>

                <button
                  className="bg-[#d36a1f] text-white p-2 rounded-md mt-4"
                  onClick={() => createRandomScores(agent.name)}
                >
                  Score Other Agents
                </button>
                {agent.name === "news_agent" ? (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold">Trust</h3>
                    {newsTrust.map((trust, i) => (
                      <div
                        key={`news_agent-` + trust.scope + i}
                        className="flex flex-col"
                      >
                        <p className="font-semibold">From {trust.from}</p>
                        <p>Scope: {trust.scope}</p>
                        <p>Level: {trust.level}</p>
                        <p>Reasons: {trust.reason?.join(", ")}</p>
                        <p>---</p>
                      </div>
                    ))}
                  </div>
                ) : agent.name === "aave_agent" ? (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold">Trust</h3>
                    {aaveTrust.map((trust, i) => (
                      <div
                        key={`aave_agent-` + trust.scope + i}
                        className="flex flex-col"
                      >
                        <p className="font-semibold">From {trust.from}</p>
                        <p>Scope: {trust.scope}</p>
                        <p>Level: {trust.level}</p>
                        <p>Reasons: {trust.reason?.join(", ")}</p>
                        <p>---</p>
                      </div>
                    ))}
                  </div>
                ) : agent.name === "dune_agent" ? (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold">Trust</h3>
                    {duneTrust.map((trust, i) => (
                      <div
                        key={`dune_agent-` + trust.scope + i}
                        className="flex flex-col"
                      >
                        <p className="font-semibold">From {trust.from}</p>
                        <p>Scope: {trust.scope}</p>
                        <p>Level: {trust.level}</p>
                        <p>Reasons: {trust.reason?.join(", ")}</p>
                        <p>---</p>
                      </div>
                    ))}
                  </div>
                ) : agent.name === "compound_agent" ? (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold">Trust</h3>
                    {compoundTrust.map((trust, i) => (
                      <div
                        key={`compound_agent-` + trust.scope + i}
                        className="flex flex-col"
                      >
                        <p className="font-semibold">From {trust.from}</p>
                        <p>Scope: {trust.scope}</p>
                        <p>Level: {trust.level}</p>
                        <p>Reasons: {trust.reason?.join(", ")}</p>
                        <p>---</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <button
                  className="bg-[#d36a1f] text-white p-2 rounded-md mt-4 mb-4"
                  onClick={async () => {
                    await handleOnSubmit(agent.name);
                  }}
                >
                  Submit
                </button>
              </div>
            ))}
          </>
        ) : (
          <GlobalScoresPieCharts data={globalScores} />
        )}
      </div>
    </div>
  );
}
