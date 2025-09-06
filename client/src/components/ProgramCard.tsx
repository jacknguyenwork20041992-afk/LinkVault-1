import { ArrowRight, Book } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Program } from "@/types";

interface ProgramCardProps {
  program: Program;
}

export default function ProgramCard({ program }: ProgramCardProps) {

  const getIcon = () => {
    return <Book className="text-primary text-xl" />;
  };

  return (
    <Link href={`/program/${program.id}`}>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md hover:shadow-xl cursor-pointer group transition-all duration-300 hover:-translate-y-1 h-64 flex flex-col" data-testid={`card-program-${program.id}`}>
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center flex-1">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <Book className="text-white text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 text-xl leading-tight">{program.name}</h3>
                <div className="mt-3 space-y-2">
                  {program.curriculum && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">Giáo trình:</span>
                      <Badge className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 dark:from-blue-900/20 dark:to-blue-800/20 dark:text-blue-400 border-0 font-bold text-sm px-3 py-1 ml-2">
                        📚 {program.curriculum}
                      </Badge>
                    </div>
                  )}
                  {program.ageRange && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">Độ tuổi:</span>
                      <Badge className="bg-gradient-to-r from-green-100 to-green-50 text-green-700 dark:from-green-900/20 dark:to-green-800/20 dark:text-green-400 border-0 font-bold text-sm px-3 py-1 ml-2">
                        👥 {program.ageRange}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <ArrowRight className="text-blue-600 dark:text-blue-400 h-6 w-6 group-hover:translate-x-1 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-all duration-200" />
          </div>
          
          <div className="flex-1 flex flex-col justify-between">
            {program.description ? (
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4">
                {program.description}
              </p>
            ) : (
              <div className="mb-4"></div>
            )}
            
            <div className="flex items-center text-sm text-blue-700 dark:text-blue-300 font-semibold group-hover:text-blue-800 dark:group-hover:text-blue-200 transition-colors duration-200">
              <span>Khám phá chương trình</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
