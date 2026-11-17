import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { MODERATION_MODULE } from ".."
import ModerationModuleService from "../service"
import { Claim } from "../models/claim"

jest.setTimeout(60 * 1000)

moduleIntegrationTestRunner<ModerationModuleService>({
  moduleName: MODERATION_MODULE,
  moduleModels: [Claim],
  resolve: "./src/modules/moderation",
  testSuite: ({ service }) => {
    const claimData = {
      lot_id: "lot_1",
      customer_id: "cus_1",
      seller_id: "sel_1",
      remedy: "refund" as const,
      video_file_key: "private-fake.mp4",
    }

    it("creates a claim as open with the claim id prefix", async () => {
      const [claim] = await service.createClaims([claimData])

      expect(claim.status).toEqual("open")
      expect(claim.id).toMatch(/^claim_/)
    })

    it("refuses a second claim on the same lot", async () => {
      await service.createClaims([claimData])

      await expect(
        service.createClaims([{ ...claimData, customer_id: "cus_2" }])
      ).rejects.toThrow()
      expect(await service.listClaims({ lot_id: "lot_1" })).toHaveLength(1)
    })

    it("refuses a status outside the D-038 enum", async () => {
      await expect(
        service.createClaims([{ ...claimData, status: "accepted" as never }])
      ).rejects.toThrow()
    })
  },
})
