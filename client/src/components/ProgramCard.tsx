import { ArrowRight, Book, GraduationCap, Globe, Lightbulb, Target, Award, Heart, Star, Sparkles, Zap, Users, Rocket, Trophy } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Program } from "@/types";

interface ProgramCardProps {
  program: Program;
}

export default function ProgramCard({ program }: ProgramCardProps) {

  // Icon mapping
  const iconMap = {
    Book, GraduationCap, Globe, Lightbulb, Target, Award, Heart, Star, Sparkles, Zap, Users, Rocket, Trophy
  };

  // Color gradients mapping
  const colorGradients = {
    blue: "from-blue-500 via-blue-600 to-blue-700 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600",
    green: "from-green-500 via-green-600 to-green-700 dark:from-green-400 dark:via-green-500 dark:to-green-600",
    purple: "from-purple-500 via-purple-600 to-purple-700 dark:from-purple-400 dark:via-purple-500 dark:to-purple-600",
    red: "from-red-500 via-red-600 to-red-700 dark:from-red-400 dark:via-red-500 dark:to-red-600",
    orange: "from-orange-500 via-orange-600 to-orange-700 dark:from-orange-400 dark:via-orange-500 dark:to-orange-600",
    yellow: "from-yellow-500 via-yellow-600 to-yellow-700 dark:from-yellow-400 dark:via-yellow-500 dark:to-yellow-600",
    pink: "from-pink-500 via-pink-600 to-pink-700 dark:from-pink-400 dark:via-pink-500 dark:to-pink-600",
    indigo: "from-indigo-500 via-indigo-600 to-indigo-700 dark:from-indigo-400 dark:via-indigo-500 dark:to-indigo-600",
    teal: "from-teal-500 via-teal-600 to-teal-700 dark:from-teal-400 dark:via-teal-500 dark:to-teal-600",
    cyan: "from-cyan-500 via-cyan-600 to-cyan-700 dark:from-cyan-400 dark:via-cyan-500 dark:to-cyan-600",
  };

  const getIcon = () => {
    const iconName = program.iconName || "Book";
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Book;
    return <IconComponent className="text-white text-2xl" />;
  };

  const getGradient = () => {
    const colorScheme = program.colorScheme || "blue";
    return colorGradients[colorScheme as keyof typeof colorGradients] || colorGradients.blue;
  };

  return (
    <Link href={`/program/${program.id}`}>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md hover:shadow-xl cursor-pointer group transition-all duration-300 hover:-translate-y-1 h-64 flex flex-col" data-testid={`card-program-${program.id}`}>
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center flex-1">
              <div className={`w-16 h-16 bg-gradient-to-br ${getGradient()} rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                {getIcon()}
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
