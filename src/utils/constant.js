import { v4 as uuidv4 } from "uuid";

export const STORAGE_KEY = "soroban_studio_workspace_v2";

export const LIB_DOT_RS_ID = uuidv4();

export const initialLibRsContent = `#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Symbol, log};

#[contract]
pub struct CounterContract;

#[contractimpl]
impl CounterContract {
    pub fn increment(env: Env, value: i32) -> i32 {
        let key = Symbol::new(&env, "COUNTER");
        let count: i32 = env.storage().instance().get(&key).unwrap_or(0);
        let next = count + value;
        env.storage().instance().set(&key, &next);
        log!(&env, "counter updated: {}", next);
        next
    }

    pub fn get(env: Env) -> i32 {
        let key = Symbol::new(&env, "COUNTER");
        env.storage().instance().get(&key).unwrap_or(0)
    }
}`;

export const starterFiles = {
	"contracts/counter/src/lib.rs": `#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Symbol, log};

#[contract]
pub struct CounterContract;

#[contractimpl]
impl CounterContract {
    pub fn increment(env: Env, value: i32) -> i32 {
        let key = Symbol::new(&env, "COUNTER");
        let count: i32 = env.storage().instance().get(&key).unwrap_or(0);
        let next = count + value;
        env.storage().instance().set(&key, &next);
        log!(&env, "counter updated: {}", next);
        next
    }

    pub fn get(env: Env) -> i32 {
        let key = Symbol::new(&env, "COUNTER");
        env.storage().instance().get(&key).unwrap_or(0)
    }
}
`,
	"contracts/counter/Cargo.toml": `[package]
name = "counter"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
soroban-sdk = "22.0.0"
`,
	"tests/counter.spec.ts": `describe("counter contract", () => {
  it("increments and reads state", async () => {
    const contractId = "CCOUNTER123";
    expect(contractId).toBeTruthy();
  });
});
`,
	"audit/audit.config.json": `{
  "rules": ["overflow-check", "unbounded-loop", "auth-coverage"],
  "severity": "medium"
}
`,
	"README.md": `# Soroban Studio

A browser IDE for building, testing, auditing, and simulating Soroban smart contracts.
`,
};

export const starterLogs = [
	{ type: "info", text: "Soroban Studio booted successfully." },
	{ type: "success", text: "Local sandbox chain running on port 8000." },
	{ type: "info", text: "Monaco editor initialized." },
];

export const starterTests = [
	{
		id: 1,
		name: "increment returns updated value",
		status: "passed",
		duration: "42ms",
	},
	{
		id: 2,
		name: "get returns persisted state",
		status: "passed",
		duration: "18ms",
	},
	{
		id: 3,
		name: "rejects invalid auth in privileged flow",
		status: "idle",
		duration: "-",
	},
];

export const starterAuditChecks = [
	{ name: "Overflow / underflow scan", status: "ok" },
	{ name: "Authorization coverage", status: "warning" },
	{ name: "Storage access pattern", status: "ok" },
	{ name: "Loop bound analysis", status: "ok" },
];

export const networkOptions = [
	{
		value: "sandbox",
		label: "Local Sandbox",
		rpc: "localhost:8000/soroban/rpc",
	},
	{ value: "testnet", label: "Testnet", rpc: "soroban-testnet.stellar.org" },
	{ value: "mainnet", label: "Mainnet", rpc: "soroban-mainnet.stellar.org" },
	{ value: "futurenet", label: "Futurenet", rpc: "rpc-futurenet.stellar.org" },
];
