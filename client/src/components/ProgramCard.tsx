import { ArrowRight, Book } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Program } from "@shared/schema";

interface ProgramCardProps {
  program: Program;
}

export default function ProgramCard({ program }: ProgramCardProps) {
  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "cơ bản":
        return "bg-accent/10 text-accent";
      case "trung cấp":
        return "bg-primary/10 text-primary";
      case "nâng cao":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-secondary/10 text-secondary-foreground";
    }
  };

  const getIcon = () => {
    return <Book className="text-primary text-xl" />;
  };

  return (
    <Link href={`/program/${program.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-program-${program.id}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                {getIcon()}
              </div>
              <h3 className="font-semibold text-foreground">{program.name}</h3>
            </div>
            <ArrowRight className="text-muted-foreground h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
