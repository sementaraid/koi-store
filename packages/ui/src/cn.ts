import { createCn } from "cn/config"

/* The kit's radii are its own tokens (`--radius-button`, `--radius-control`, ...
   in styles.css). The stock `cn` table does not know those names, so it keeps a
   caller's `rounded-sm` next to a button's `rounded-button` and the stylesheet
   picks one by source order. Registering the tokens as radius utilities makes
   the last class win, which is what `cva` + `cn` already promise: a Button
   variant's radius survives a plain link default, and a caller's `rounded-full`
   or `rounded-button!` override survives the variant. */
export const cn = createCn({
  extend: {
    theme: {
      radius: ["badge", "control", "button", "card", "field", "dialog", "sheet"]
    }
  }
})
