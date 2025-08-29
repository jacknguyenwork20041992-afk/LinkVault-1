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
        return "bg-gradient-to-r from-green-100 to-green-50 text-green-700 dark:from-green-900/20 dark:to-green-800/20 dark:text-green-400";
      case "trung cấp":
        return "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 dark:from-blue-900/20 dark:to-blue-800/20 dark:text-blue-400";
      case "nâng cao":
        return "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 dark:from-purple-900/20 dark:to-purple-800/20 dark:text-purple-400";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 dark:from-gray-800/20 dark:to-gray-700/20 dark:text-gray-400";
    }
  };

  const getIcon = () => {
    return <Book className="text-primary text-xl" />;
  };

  return (
    <Link href={`/program/${program.id}`}>
      <div className="vibrant-card hover-lift cursor-pointer group" data-testid={`card-program-${program.id}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center flex-1">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl flex items-center justify-center mr-4 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300 animate-pulse-glow">
                <Book className="text-blue-600 dark:text-blue-400 text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-blue-600 transition-colors duration-200 text-lg">{program.name}</h3>
                <Badge className={`mt-2 ${getLevelColor(program.level)} border-0`}>
                  {program.level}
                </Badge>
              </div>
            </div>
            <ArrowRight className="text-blue-500 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
          </div>
          
          {program.description && (
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-4">
              {program.description}
            </p>
          )}
          
          <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
            <span>Khám phá chương trình</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
