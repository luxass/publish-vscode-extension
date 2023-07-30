import { setFailed, setOutput } from "@actions/core"

async function run() {
  console.log("Hello, World!")
}

run().catch((err) => {
  console.error(err)
  setFailed(err)
  process.exit(1)
})
