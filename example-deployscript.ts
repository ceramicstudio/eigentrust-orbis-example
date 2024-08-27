import { OrbisDB } from "@useorbis/db-sdk";

const deploy = async () => {
  // must be authenticated on the node to deploy a schema

  const def = {
    name: "agent-trust-credential",
    views: {
      issuer: {
        type: "documentAccount",
      },
    },
    schema: {
      type: "object",
      $defs: {
        CeramicStreamID: {
          type: "string",
          title: "CeramicStreamID",
          maxLength: 100,
        },
        DateTime: {
          type: "string",
          title: "DateTime",
          format: "date-time",
          maxLength: 100,
        },
      },
      $schema: "https://json-schema.org/draft/2020-12/schema",
      required: ["trustworthiness", "issued", "agentId"],
      properties: {
        trustworthiness: {
          type: "array",
          items: {
            type: "object",
            properties: {
              scope: {
                type: "string",
              },
              level: {
                type: "number",
                minimum: 0,
                maximum: 100,
              },
              reason: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            required: ["scope", "level", "reason"],
            additionalProperties: false,
          },
        },
        issued: {
          $ref: "#/$defs/DateTime",
        },
        agentId: {
          $ref: "#/$defs/CeramicStreamID",
        },
      },
      additionalProperties: false,
    },
    version: "2.0",
    interface: false,
    implements: [],
    description: "A trust credential",
    accountRelation: {
      type: "set",
      fields: ["agentId"],
    },
    immutableFields: [],
  };

  const orbis = new OrbisDB({
    ceramic: {
      gateway: "https://ceramic-orbisdb-mainnet-direct.hirenodes.io/",
    },
    nodes: [
      {
        gateway: "https://studio.useorbis.com",
        env: "did:pkh:eip155:1:0x514e3b94f0287caf77009039b72c321ef5f016e6",
      },
    ],
  });

  //@ts-expect-error - orbis does not know definition is correct
  const deployedSchema = await orbis.ceramic.createModel(def);
  console.log(deployedSchema);
};
