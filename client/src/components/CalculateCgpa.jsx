import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import NavBar from "./NavBar";
import SideBar from "./SideBar";
import { Button } from "@/components/ui/button";
import { Pencil, SquareArrowOutUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { set } from "react-hook-form";
import { Label } from "../components/ui/Label";
import { cn } from "@/lib/utils";
import Spinner from "./Spinner";
const BACKEND = import.meta.env.VITE_BACKEND_URL;
const ELECTIVES_JSON_URL =
  "https://raw.githubusercontent.com/rahulharpal1603/json/main/electives.json";

const gradePoints = {
  A: 10,
  AB: 9,
  B: 8,
  BC: 7,
  C: 6,
  CD: 5,
  D: 4,
  F: 0,
};

export default function CalculateCgpa() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creditsCompleted, setCreditsCompleted] = useState("");
  const [selectedGrades, setSelectedGrades] = useState({});
  const [cgpa, setCgpa] = useState(null);
  const [sgpa, setSgpa] = useState(null);
  const [electiveCount, setElectiveCount] = useState(0);
  const [currSemCredits, setCurrSemCredits] = useState(0);
  const [targetCgpa, setTargetCgpa] = useState("");
  const [reqSgpa, setReqSgpa] = useState(null);
  const profileData = JSON.parse(localStorage.getItem("user"));
  const userDepartment = profileData?.department;
  const userSemester = profileData?.semester;
  const currentCGPA = profileData?.cgpa;

  useEffect(() => {
    const fetchElectivesData = async () => {
      try {
        const response = await fetch(ELECTIVES_JSON_URL);
        if (!response.ok) throw new Error("Failed to fetch electives data");

        const electivesData = await response.json();
        const departmentElectives = electivesData[userDepartment];
        setElectiveCount(departmentElectives?.[userSemester] || 0);
      } catch (error) {
        console.error("Error fetching electives data:", error);
      }
    };

    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const options = {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        };
        const response = await fetch(
          `${BACKEND}/api/course/${userDepartment}/${userSemester}`,
          options
        );
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        const filteredCourses = data.data.filter(
          (course) => !course.isElective
        );
        setCourses(filteredCourses);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setLoading(false);
      }
    };

    fetchElectivesData();
    fetchCourses();
  }, [userDepartment, userSemester]);

  const handleGradeChange = (courseId, grade) => {
    setSelectedGrades((prev) => ({ ...prev, [courseId]: grade }));
  };

  // ***************************************Custom Subject ***********************************************
  const [customSubjectName, setCustomSubjectName] = useState("");
  const [customSubjectCredits, setCustomSubjectCredits] = useState("");
  const [error, setError] = useState("");

  const addCustomSubject = () => {
    setError("");

    // Validate inputs
    if (!customSubjectName.trim()) {
      setError("Course name is required");
      return;
    }
    if (!customSubjectCredits || customSubjectCredits <= 0) {
      setError("Credits must be a positive number");
      return;
    }

    // Create new custom subject in same format as courses
    const newSubject = {
      _id: `custom-${Date.now()}`,
      name: customSubjectName,
      credits: Number(customSubjectCredits),
      isCustom: true, // flag to identify custom subjects
    };

    setCourses((prev) => [...prev, newSubject]);

    setCurrSemCredits((prev) => prev + Number(customSubjectCredits));

    setCustomSubjectName("");
    setCustomSubjectCredits("");
  };

  const removeCustomSubject = (courseId) => {
    setCourses((prev) => {
      const courseToRemove = prev.find((course) => course._id === courseId);
      if (courseToRemove) {
        setCurrSemCredits(
          (prevCredits) => prevCredits - courseToRemove.credits
        );
        // Remove the grade if it exists
        if (selectedGrades[courseId]) {
          const newGrades = { ...selectedGrades };
          delete newGrades[courseId];
          setSelectedGrades(newGrades);
        }
      }
      return prev.filter((course) => course._id !== courseId);
    });
  };

  // ***************************************Custom Subject ***********************************************

  const calcReqSGPA = () => {
    // const targetCgpa = Number(targetCgpa);
    // const currSemCredits = Number(currSemCredits);
    // const currCgpa = Number(currentCGPA);
    const ans =
      (Number(targetCgpa) *
        (Number(creditsCompleted) + Number(currSemCredits)) -
        Number(currentCGPA) * Number(creditsCompleted)) /
      Number(currSemCredits);
    console.log(currSemCredits, creditsCompleted, targetCgpa, currentCGPA, ans);
    setReqSgpa(ans.toFixed(2));
  };
  const calculateCgpa = () => {
    let totalGradePoints = 0;
    let semesterCredits = 0;

    // Calculate for regular and custom courses
    courses.forEach((course) => {
      const grade = selectedGrades[course._id];
      if (grade) {
        const points = gradePoints[grade] * (course.credits || 0);
        totalGradePoints += points;
        semesterCredits += course.credits || 0;
      }
    });

    // Calculate for electives
    for (let i = 0; i < electiveCount; i++) {
      const grade = selectedGrades[`elective-${i + 1}`];
      if (grade) {
        const points = gradePoints[grade] * 3; // Electives are 3 credits
        totalGradePoints += points;
        semesterCredits += 3;
      }
    }

    // Update currSemCredits with total credits for the semester
    setCurrSemCredits(semesterCredits);

    const cumulativePoints = currentCGPA * creditsCompleted;
    const newCgpa =
      (cumulativePoints + totalGradePoints) /
      (Number(creditsCompleted) + semesterCredits);
    const sgpa = totalGradePoints / semesterCredits;

    setSgpa(sgpa.toFixed(2));
    setCgpa(newCgpa.toFixed(2));
  };

  const navigate = useNavigate();
  function isNumeric(str) {
    if (typeof str != "string") return false; // we only process strings!
    return (
      !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
      !isNaN(parseFloat(str)) &&
      str > 0
    ); // ...and ensure strings of whitespace fail
  }
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f4f4f5]">
      <NavBar />
      <div className="flex flex-1">
        <SideBar />
        <main className="flex-1 p-4 md:p-6 md:ml-[217px]">
          <Card className="max-w-xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-xl font-semibold">
                Predict SGPA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between px-7">
                <LabelInputContainer className="mt-6">
                  <Label className="ml-1">Current CGPA</Label>
                  <div className="flex">
                    <Input
                      type="text"
                      placeholder="CGPA"
                      value={currentCGPA}
                      disabled
                      className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-700 max-w-[150px]"
                    />
                    <Button
                      className="p-2 ml-1 h-[43px] w-[43px] "
                      onClick={() => {
                        navigate("/my-profile");
                      }}>
                      <Pencil />
                    </Button>
                  </div>
                </LabelInputContainer>
                <LabelInputContainer className="mt-6 max-w-[154px]">
                  <Label className="ml-1">Target CGPA</Label>
                  <Input
                    type="text"
                    placeholder="Target CGPA"
                    value={targetCgpa}
                    onChange={(e) => setTargetCgpa(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-700 max-w-[150px] "
                  />
                </LabelInputContainer>
              </div>
              <div className="flex justify-between px-7 ">
                <LabelInputContainer className="mt-6 max-w-[154px]">
                  <Label className="ml-1">Current Sem Credits</Label>
                  <Input
                    placeholder={"Credits"}
                    value={currSemCredits}
                    onChange={(e) => setCurrSemCredits(e.target.value)}
                  />
                </LabelInputContainer>
                <LabelInputContainer className="mt-6 max-w-[154px]">
                  <Label className="ml-1">Credits Completed</Label>
                  <Input
                    placeholder={"Credits Completed"}
                    value={creditsCompleted}
                    onChange={(e) => setCreditsCompleted(e.target.value)}
                  />
                </LabelInputContainer>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-center">
              <Button
                onClick={calcReqSGPA}
                disabled={
                  loading ||
                  !isNumeric(targetCgpa) ||
                  !isNumeric(currSemCredits) ||
                  !isNumeric(creditsCompleted)
                }>
                Show required SGPA
              </Button>
              {reqSgpa && (
                <>
                  <p className="mt-4 text-lg font-semibold">
                    Required SGPA: {reqSgpa}
                  </p>
                  <a
                    href="https://sgpa-calculator-lnmiit.netlify.app/"
                    target="_blank">
                    <p className="flex items-center mt-2">
                      SGPA Calculator
                      <SquareArrowOutUpRight className="h-5 w-5 ml-2" />
                    </p>
                  </a>
                </>
              )}
            </CardFooter>
          </Card>

          {loading ? (
            <Spinner />
          ) : (
            <Card className="max-w-xl mx-auto shadow-lg mt-4">
              <CardHeader>
                <CardTitle className="text-center text-xl font-semibold">
                  Calculate CGPA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardContent>
                  {/* Current CGPA and Credits Completed Section */}
                  <div className="flex justify-between px-7">
                    <div className="flex items-center">
                      <LabelInputContainer className="mt-6">
                        <Label className="ml-1">Current CGPA</Label>
                        <div className="flex">
                          <Input
                            type="text"
                            placeholder="CGPA"
                            value={currentCGPA}
                            disabled
                            className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-700 max-w-[150px]"
                          />
                          <Button
                            className="p-2 ml-1 h-[43px] w-[43px]"
                            onClick={() => {
                              navigate("/my-profile");
                            }}>
                            <Pencil />
                          </Button>
                        </div>
                      </LabelInputContainer>
                    </div>
                    <LabelInputContainer className="mt-6 max-w-[154px]">
                      <Label className="ml-1">Credits Completed</Label>
                      <Input
                        placeholder={"Credits Completed"}
                        value={creditsCompleted}
                        onChange={(e) => setCreditsCompleted(e.target.value)}
                      />
                    </LabelInputContainer>
                  </div>

                  <div className="mt-4 px-7 pt-5">
                    {/* Regular Courses */}
                    {courses.map((course) => (
                      <div
                        key={course._id}
                        className="flex justify-between items-center mb-2">
                        <span className="flex justify-center items-center">
                          {course.name} ({course.credits} credits)
                          {course.isCustom && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomSubject(course._id)}
                              className="pl-2">
                              <img
                                src="https://cdn-icons-png.flaticon.com/512/5028/5028066.png"
                                // src="https://img.icons8.com/?size=512&id=3062&format=png"
                                alt="remove"
                                className="h-5 w-5"
                              />
                            </Button>
                          )}
                        </span>
                        <div className="flex items-center space-x-2">
                          <select
                            value={selectedGrades[course._id] || ""}
                            onChange={(e) =>
                              handleGradeChange(course._id, e.target.value)
                            }
                            className="p-2 border border-gray-300 rounded-md dark:border-gray-700">
                            <option value="" disabled>
                              Select Grade
                            </option>
                            {Object.keys(gradePoints).map((grade) => (
                              <option key={grade} value={grade}>
                                {grade}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}

                    {/* Electives */}
                    {[...Array(electiveCount)].map((_, i) => (
                      <div
                        key={`elective-${i + 1}`}
                        className="flex justify-between items-center mb-2">
                        <span>Elective {i + 1} (3 credits)</span>
                        <select
                          value={selectedGrades[`elective-${i + 1}`] || ""}
                          onChange={(e) =>
                            handleGradeChange(
                              `elective-${i + 1}`,
                              e.target.value
                            )
                          }
                          className="p-2 border border-gray-300 rounded-md dark:border-gray-700">
                          <option value="" disabled>
                            Select Grade
                          </option>
                          {Object.keys(gradePoints).map((grade) => (
                            <option key={grade} value={grade}>
                              {grade}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}

                    {/* Custom Subject Form */}
                    <div className="p-4 border mt-10 rounded-md bg-gray-50">
                      <h3 className="text-lg font-semibold mb-4">
                        Add Custom Subject
                      </h3>

                      {error && (
                        <div className="mb-4 text-red-500 text-sm">{error}</div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:space-x-4">
                        <LabelInputContainer className="flex-1 mb-4 sm:mb-0">
                          <Label>Course Name</Label>
                          <Input
                            value={customSubjectName}
                            placeholder="Course name"
                            onChange={(e) =>
                              setCustomSubjectName(e.target.value)
                            }
                          />
                        </LabelInputContainer>

                        <LabelInputContainer className="w-full sm:w-32 mb-4 sm:mb-0">
                          <Label>Credits</Label>
                          <Input
                            value={customSubjectCredits}
                            type="number"
                            min="2"
                            placeholder="Credits"
                            onChange={(e) =>
                              setCustomSubjectCredits(e.target.value)
                            }
                          />
                        </LabelInputContainer>

                        <Button
                          onClick={addCustomSubject}
                          className="mt-4 sm:mt-7">
                          Add Subject
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CardContent>
              <CardFooter className="flex flex-col items-center">
                <Button
                  onClick={calculateCgpa}
                  disabled={loading || !isNumeric(creditsCompleted)}>
                  Calculate CGPA
                </Button>
                {cgpa && sgpa && (
                  <>
                    <p className="mt-4 text-lg font-semibold">CGPA: {cgpa}</p>
                    <p className="mt-4 text-lg font-semibold">SGPA: {sgpa}</p>
                  </>
                )}
              </CardFooter>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

const LabelInputContainer = ({ children, className }) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};
