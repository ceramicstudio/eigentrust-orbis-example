"use client";

import { useEffect, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
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
      <div key={key} className="w-full bg-gray-300 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-center">{key}</h2>
        <ResponsiveContainer width="100%" height={500}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              // label={({ name, percent }) =>
              //   `${name} ${(percent * 100).toFixed(0)}%`
              // }
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
    <div className="container mx-auto px-4">
      <div className="flex flex-wrap -mx-4">
        {Object.entries(data).map(([key, value]) => renderPieChart(key, value))}
      </div>
    </div>
  );
};

export default function AgentSection() {
  const [viewScores, setViewScores] = useState(false);
  const [globalScores, setGlobalScores] = useState<GlobalScores>({});
  const { address } = useAccount();
  const [scopes, setScopes] = useState<
    {
      agentName: string;
      scope: string;
    }[]
  >([]);
  const [levels, setLevels] = useState<
    {
      agentName: string;
      level: number;
    }[]
  >([]);
  const [reasons, setReasons] = useState<
    {
      agentName: string;
      reason: string[];
    }[]
  >([]);
  const [newsTrust, setNewsTrust] = useState<TrustType[]>([]);
  const [aaveTrust, setAaveTrust] = useState<TrustType[]>([]);
  const [duneTrust, setDuneTrust] = useState<TrustType[]>([]);
  const [compoundTrust, setCompoundTrust] = useState<TrustType[]>([]);

  const { orbis, setAuth } = useStore();

  const getAllRecords = async () => {
    try {
      await orbis.getConnectedUser();
      const recordsQuery = await orbis
        .select()
        .raw(
          "SELECT * FROM kjzl6hvfrbw6c9yovsnmz91qcj8p1dkudjym6rrh30rvwdyiae1407s7ac9yems"
        )
        .run();
      console.log(recordsQuery);

      // get calculated scores from port 8080
      const scores = await fetch("http://localhost:8080", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const scoresData = (await scores.json()) as GlobalScores;
      setGlobalScores(scoresData);
      console.log(scoresData);
    } catch (error) {
      console.log(error);
    }
  };

  const handleOnSubmit = async (name: string) => {
    try {
      console.log(name);
      await orbis.getConnectedUser();
      const newRecord = await orbis
        .insert(
          "kjzl6hvfrbw6c9yovsnmz91qcj8p1dkudjym6rrh30rvwdyiae1407s7ac9yems"
        )
        .value({
          trustworthiness:
            name === "news_agent"
              ? newsTrust
              : name === "aave_agent"
              ? aaveTrust
              : name === "dune_agent"
              ? duneTrust
              : compoundTrust,
          issued: new Date().toISOString(),
          agentId: name,
        })
        .context(
          "kjzl6kcym7w8y5fifkfukk696ahuas8dzi0vp78glv47o1h94qownll07fxqdco"
        )
        .run();
      console.log(newRecord);
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

  const handleAddReason = (name: string, e: any) => {
    const scope = scopes.find((scope) => scope.agentName === name);
    const level = levels.find((level) => level.agentName === name);
    const reason = reasons.find((reason) => reason.agentName === name);
    if (!scope || !level || !reason) {
      toast.warn("Please fill in all fields");
      return;
    }
    switch (name) {
      case "news_agent":
        setNewsTrust([
          ...newsTrust,
          { scope: scope.scope, level: level.level, reason: reason.reason },
        ]);
        break;
      case "aave_agent":
        setAaveTrust([
          ...aaveTrust,
          { scope: scope.scope, level: level.level, reason: reason.reason },
        ]);
        break;
      case "dune_agent":
        setDuneTrust([
          ...duneTrust,
          { scope: scope.scope, level: level.level, reason: reason.reason },
        ]);
        break;
      case "compound_agent":
        setCompoundTrust([
          ...compoundTrust,
          { scope: scope.scope, level: level.level, reason: reason.reason },
        ]);
        break;
    }
    console.log(newsTrust, aaveTrust, duneTrust, compoundTrust);
    setLevels(levels.filter((level) => level.agentName !== name));
    setScopes(scopes.filter((scope) => scope.agentName !== name));
    setReasons(reasons.filter((reason) => reason.agentName !== name));
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
       {
        viewScores ? "View Agents" : "View Scores"
       }
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
                <label className="text-sm font-semibold mt-4">Scope</label>
                <TextareaAutosize
                  className="resize-none w-1/2 h-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Scope (e.g. 'Accuracy') - REQUIRED"
                  value={
                    scopes.find((scope) => scope.agentName === agent.name)
                      ?.scope ?? ""
                  }
                  onChange={(e) => {
                    const currentScope = scopes.find(
                      (scope) => scope.agentName === agent.name
                    );
                    if (currentScope) {
                      setScopes(
                        scopes.map((scope) =>
                          scope.agentName === agent.name
                            ? { agentName: agent.name, scope: e.target.value }
                            : scope
                        )
                      );
                    } else {
                      setScopes([
                        ...scopes,
                        { agentName: agent.name, scope: e.target.value },
                      ]);
                    }
                  }}
                />
                <label className="text-sm font-semibold mt-4">Level</label>
                <input
                  type="range"
                  className="w-3/4"
                  value={
                    levels.find((level) => level.agentName === agent.name)
                      ?.level ?? 0
                  }
                  onChange={(e) => {
                    const currentLevel = levels.find(
                      (level) => level.agentName === agent.name
                    );
                    if (currentLevel) {
                      setLevels(
                        levels.map((level) =>
                          level.agentName === agent.name
                            ? {
                                agentName: agent.name,
                                level: Number(e.target.value),
                              }
                            : level
                        )
                      );
                    } else {
                      setLevels([
                        ...levels,
                        {
                          agentName: agent.name,
                          level: Number(e.target.value),
                        },
                      ]);
                    }
                  }}
                />
                <label className="text-sm font-semibold mt-4">Reasons</label>
                <TextareaAutosize
                  className="resize-none w-1/2 h-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Comma-separated reasons"
                  value={
                    reasons
                      .find((reason) => reason.agentName === agent.name)
                      ?.reason.join(",") ?? ""
                  }
                  onChange={(e) => {
                    const currentReason = reasons.find(
                      (reason) => reason.agentName === agent.name
                    );
                    if (currentReason) {
                      setReasons(
                        reasons.map((reason) =>
                          reason.agentName === agent.name
                            ? {
                                agentName: agent.name,
                                reason: e.target.value.split(","),
                              }
                            : reason
                        )
                      );
                    } else {
                      setReasons([
                        ...reasons,
                        {
                          agentName: agent.name,
                          reason: e.target.value.split(","),
                        },
                      ]);
                    }
                  }}
                />
                <button
                  className="bg-[#d36a1f] text-white p-2 rounded-md mt-4"
                  onClick={(e) => handleAddReason(agent.name, e)}
                >
                  Add
                </button>
                {agent.name === "news_agent" ? (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold">Trust</h3>
                    {newsTrust.map((trust) => (
                      <div key={trust.scope} className="flex flex-col">
                        <p>Scope: {trust.scope}</p>
                        <p>Level: {trust.level}</p>
                        <p>Reasons: {trust.reason?.join(", ")}</p>
                      </div>
                    ))}
                  </div>
                ) : agent.name === "aave_agent" ? (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold">Trust</h3>
                    {aaveTrust.map((trust) => (
                      <div key={trust.scope} className="flex flex-col">
                        <p>Scope: {trust.scope}</p>
                        <p>Level: {trust.level}</p>
                        <p>Reasons: {trust.reason?.join(", ")}</p>
                      </div>
                    ))}
                  </div>
                ) : agent.name === "dune_agent" ? (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold">Trust</h3>
                    {duneTrust.map((trust) => (
                      <div key={trust.scope} className="flex flex-col">
                        <p>Scope: {trust.scope}</p>
                        <p>Level: {trust.level}</p>
                        <p>Reasons: {trust.reason?.join(", ")}</p>
                      </div>
                    ))}
                  </div>
                ) : agent.name === "compound_agent" ? (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold">Trust</h3>
                    {compoundTrust.map((trust) => (
                      <div key={trust.scope} className="flex flex-col">
                        <p>Scope: {trust.scope}</p>
                        <p>Level: {trust.level}</p>
                        <p>Reasons: {trust.reason?.join(", ")}</p>
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
