import { Button } from "@/components/ui/button";
import { ArrowLeft, Grid, List } from "lucide-react";
import { ATSupplyCategory } from "../ATSupplyCategories";
import { ViewToggleProps } from "./types";

interface HeaderProps {
  category: ATSupplyCategory;
  onBack: () => void;
  viewMode: "grid" | "table";
  setViewMode: (mode: "grid" | "table") => void;
}

export const Header = ({ category, onBack, viewMode, setViewMode }: HeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{category.name}</h1>
          <p className="text-muted-foreground">{category.description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === "table" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("table")}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("grid")}
        >
          <Grid className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};