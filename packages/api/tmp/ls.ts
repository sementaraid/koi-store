import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
export default async function run({ container }: ExecArgs) {
  const q = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await q.graph({ entity: "customer", fields: ["id","email","first_name"] })
  console.log(data.map((c:any) => c.email + " " + c.id).join("\n"))
}
