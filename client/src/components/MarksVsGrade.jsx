import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Book,
  Star,
  User,
  Calendar,
  Calculator,
  ChartArea,
  HandHeart,
  MessageCircle,
} from "lucide-react";
import NavBar from "./NavBar";
import SideBar from "./SideBar";
import Graph from "./Graph";
export default function MarksVsGrade() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <NavBar />
      <div className="flex flex-1">
        <SideBar />
        <main className="flex-1 p-4 md:p-6 md:ml-[217px]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="transition-transform hover:scale-105">
              <CardHeader>
                <CardTitle>Marks V/S Grade PROTOTYPE</CardTitle>
                <Graph />
              </CardHeader>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
