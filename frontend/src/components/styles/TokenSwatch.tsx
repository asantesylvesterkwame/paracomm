import * as React from "react";
import DivElement from "@/components/elements/DivElement";
import type { ColorToken } from "@/constants/styleGuide";

type TokenSwatchProps = {
  token: ColorToken;
};

const TokenSwatch: React.FC<TokenSwatchProps> = ({ token }) => {
  return (
    <DivElement className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <DivElement className="flex-row h-20">
        <div
          className="h-full w-1/2 border-r border-border/60"
          style={{ background: token.light }}
        />
        <div className="h-full w-1/2" style={{ background: token.dark }} />
      </DivElement>
      <DivElement className="gap-1 p-3">
        <code className="text-[13px] font-medium text-foreground">
          --{token.name}
        </code>
        <span className="text-[11px] text-muted-foreground">{token.role}</span>
        <DivElement className="flex-row gap-2 mt-1 text-[10px] text-muted-foreground">
          <span>{token.light}</span>
          <span className="opacity-40">·</span>
          <span>{token.dark}</span>
        </DivElement>
      </DivElement>
    </DivElement>
  );
};

export default TokenSwatch;
