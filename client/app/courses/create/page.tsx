"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

interface Lesson {
  id?: number;
  title: string;
  duration: string;
  media_url?: string;
  sort_order: number;
  hands_on_task?: string;
  project_milestone?: string;
  tech_stack?: string;
  difficulty?: string;
}

interface Section {
  id?: number;
  title: string;
  sort_order: number;
  lessons: Lesson[];
  isExpanded?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://omnilearn-lms.onrender.com";

export default function CreateCourse() {
  const router = useRouter();

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState(1);
  const [courseId, setCourseId] = useState<number | null>(null);

  // Step 1: Course Info States
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Technology");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop");
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);

  // Step 2: Curriculum Builder States
  const [sections, setSections] = useState<Section[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  // New States for File Import & zero-latency manual customizations
  const [showFileImportModal, setShowFileImportModal] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [importedSectionsPreview, setImportedSectionsPreview] = useState<Section[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState("");
  const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null);

  // Step 3: Media Upload Simulator States
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [simulatedMediaUrl, setSimulatedMediaUrl] = useState("");

  // Step 4: Pricing & Publish States
  const [price, setPrice] = useState("49.99");
  const [isPublishing, setIsPublishing] = useState(false);

  // Focus utility styling helper
  const handleInputFocus = (e: React.FocusEvent<any>) => {
    e.target.closest(".space-y-2")?.querySelector("label")?.classList.add("text-primary-container");
  };

  const handleInputBlur = (e: React.FocusEvent<any>) => {
    e.target.closest(".space-y-2")?.querySelector("label")?.classList.remove("text-primary-container");
  };

  // Thumbnail list for click-to-select mockup
  const mockThumbnails = [
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop", // Quantum
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop", // Cyber
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=600&auto=format&fit=crop", // Server
    "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=600&auto=format&fit=crop", // Web3
  ];

  // ========================================================
  // STEP 1 ACTIONS: COURSE DETAILS
  // ========================================================
  const handleSaveCourseInfo = async () => {
    if (!title.trim()) {
      toast.error("Please enter a course title.");
      return false;
    }

    setIsSubmittingInfo(true);
    try {
      const payload = { title, category, description, thumbnail_url: thumbnailUrl };
      let response;
      
      if (courseId) {
        // Update existing course
        response = await fetch(`${API_BASE_URL}/api/courses/${courseId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new course
        response = await fetch(`${API_BASE_URL}/api/courses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await response.json();
      if (json.success) {
        setCourseId(json.data.id);
        toast.success(courseId ? "Course details updated!" : "Draft course created!");
        
        // Load existing sections/lessons if any
        if (courseId) {
          fetchCurriculum(courseId);
        }
        return true;
      } else {
        toast.error(json.error || "Failed to save course.");
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection failed.");
      return false;
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  const handleNextStep1 = async () => {
    const success = await handleSaveCourseInfo();
    if (success) {
      setCurrentStep(2);
    }
  };

  // ========================================================
  // STEP 2 ACTIONS: CURRICULUM BUILDER
  // ========================================================
  const fetchCurriculum = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${id}`);
      const json = await res.json();
      if (json.success) {
        const loadedSections = (json.data.sections || []).map((s: any) => ({
          ...s,
          isExpanded: true,
          lessons: s.lessons || [],
        }));
        setSections(loadedSections);
      }
    } catch (err) {
      console.error("Failed to load curriculum:", err);
    }
  };

  useEffect(() => {
    if (courseId && currentStep === 2) {
      fetchCurriculum(courseId);
    }
  }, [courseId, currentStep]);

  const handleSaveCurriculum = async (showToast = true) => {
    if (!courseId) {
      toast.error("Please save course details first.");
      return false;
    }
    setIsImporting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}/bulk-curriculum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      const json = await response.json();
      if (json.success) {
        if (showToast) toast.success("Curriculum synced with server successfully!");
        return true;
      } else {
        toast.error(json.error || "Failed to save curriculum.");
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection failed when saving curriculum.");
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  // Purely Local Snappy Operations (0ms latency!)
  const handleAddSection = () => {
    const newSection: Section = {
      id: -Date.now(), // negative temporary ID
      title: `Section ${sections.length + 1}: New Section`,
      sort_order: sections.length + 1,
      lessons: [],
      isExpanded: true,
    };
    setSections([...sections, newSection]);
    toast.success("Section added!");
  };

  const handleUpdateSectionTitle = (sectionId: number, newTitle: string) => {
    setSections(
      sections.map(s => (s.id === sectionId ? { ...s, title: newTitle } : s))
    );
  };

  const handleDeleteSection = (sectionId: number) => {
    setSections(sections.filter(s => s.id !== sectionId));
    toast.success("Section removed.");
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[swapIndex];
    newSections[swapIndex] = temp;

    setSections(
      newSections.map((s, idx) => ({
        ...s,
        sort_order: idx + 1,
      }))
    );
  };

  const handleAddLesson = (sectionId: number) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          const newLesson: Lesson = {
            id: -Date.now() - Math.random(), // unique negative temporary ID
            title: `Lesson ${s.lessons.length + 1}: Untitled Lesson`,
            duration: "10:00",
            sort_order: s.lessons.length + 1,
          };
          return { ...s, lessons: [...s.lessons, newLesson] };
        }
        return s;
      })
    );
    toast.success("Lesson added!");
  };

  const handleUpdateLessonTitle = (sectionId: number, lessonId: number, newTitle: string) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map(l => (l.id === lessonId ? { ...l, title: newTitle } : l)),
          };
        }
        return s;
      })
    );
  };

  const handleUpdateLessonDuration = (sectionId: number, lessonId: number, newDuration: string) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map(l => (l.id === lessonId ? { ...l, duration: newDuration } : l)),
          };
        }
        return s;
      })
    );
  };

  const handleDeleteLesson = (sectionId: number, lessonId: number) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          return { ...s, lessons: s.lessons.filter(l => l.id !== lessonId) };
        }
        return s;
      })
    );
    toast.success("Lesson removed.");
  };

  const handleMoveLesson = (sectionId: number, lessonIndex: number, direction: "up" | "down") => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          const newLessons = [...s.lessons];
          const swapWithIndex = direction === "up" ? lessonIndex - 1 : lessonIndex + 1;
          if (swapWithIndex < 0 || swapWithIndex >= newLessons.length) return s;

          const temp = newLessons[lessonIndex];
          newLessons[lessonIndex] = newLessons[swapWithIndex];
          newLessons[swapWithIndex] = temp;

          return {
            ...s,
            lessons: newLessons.map((l, idx) => ({ ...l, sort_order: idx + 1 })),
          };
        }
        return s;
      })
    );
  };

  const handleClearAllCurriculum = () => {
    if (confirm("Are you sure you want to clear the entire curriculum?")) {
      setSections([]);
      toast.success("Curriculum cleared!");
    }
  };

  const handleNextStep2 = async () => {
    const success = await handleSaveCurriculum(false);
    if (success) {
      if (courseId) {
        await fetchCurriculum(courseId); // refresh to get database IDs for Step 3
      }
      setCurrentStep(3);
    }
  };

  // CSV Curriculum Importer (Text paste fallback)
  const handleCsvImport = () => {
    if (!csvText.trim()) {
      toast.error("Please enter CSV text data.");
      return;
    }

    try {
      const grid = parseCsvLines(csvText);
      processCurriculumGrid(grid);
      setShowImportModal(false);
      setCsvText("");
      toast.success("CSV text parsed into preview! review below, then click save.");
      setShowFileImportModal(true);
    } catch (e) {
      toast.error("Failed to parse CSV text.");
    }
  };

  // Dynamically load SheetJS
  const loadSheetJS = () => {
    return new Promise<any>((resolve, reject) => {
      if ((window as any).XLSX) {
        resolve((window as any).XLSX);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      script.onload = () => {
        resolve((window as any).XLSX);
      };
      script.onerror = (err) => {
        reject(err);
      };
      document.head.appendChild(script);
    });
  };

  // CSV parsing routine
  const parseCsvLines = (text: string): any[][] => {
    const lines: any[][] = [];
    let row: any[] = [];
    let inQuotes = false;
    let entry = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          entry += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(entry.trim());
        entry = "";
      } else if ((char === "\r" || char === "\n") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") {
          i++;
        }
        row.push(entry.trim());
        if (row.some(x => x !== "")) {
          lines.push(row);
        }
        row = [];
        entry = "";
      } else {
        entry += char;
      }
    }
    if (entry || row.length > 0) {
      row.push(entry.trim());
      lines.push(row);
    }
    return lines;
  };  // Process selected grid data (from CSV or Excel)
  const processCurriculumGrid = (grid: any[][]) => {
    if (grid.length === 0) return;

    // 1. Find header row — MUST have 3+ columns AND 2+ keyword matches
    //    This prevents subtitle rows like "60 Days | 2–3 Hours/Day" from being detected
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(grid.length, 15); i++) {
      const row = grid[i];
      // A valid header row has multiple columns (not a single-cell title)
      if (!row || row.length < 3) continue;
      const lowered = row.map((x: any) => String(x || "").toLowerCase().trim());
      // Count how many cells are exact or near-exact header keyword matches (short strings)
      const headerKeywords = ["day", "week", "phase", "topic", "topics covered", "lesson", "title",
        "duration", "task", "hands-on", "project", "milestone", "difficulty", "stack", "section", "module"];
      const matchCount = lowered.filter((cell: string) =>
        headerKeywords.some(kw => cell === kw || cell === kw + "s" || cell.startsWith(kw + " ") || cell.includes(kw))
          && cell.length < 40  // header cells are short; paragraph cells are not
      ).length;
      if (matchCount >= 2) {
        headerRowIdx = i;
        break;
      }
    }    const headers = grid[headerRowIdx].map(x => String(x || "").trim().toLowerCase());

    // 2. INTELLIGENT column detection — priority-ordered to prevent cross-stealing
    // Helper: strict word match (whole-word only, short cell preferred)
    const exactMatch = (cell: string, words: string[]) =>
      words.some(w => cell === w || cell === w + "s" || cell === w + ".");
    const looseMatch = (cell: string, words: string[], maxLen = 35) =>
      cell.length <= maxLen && words.some(w => cell.includes(w));

    // Detect in strict priority order — each detected column is "claimed" and excluded from others
    const claimed = new Set<number>();

    // DAY/NUMBER column — strict matching only to avoid stealing "Hands-on Task" etc.
    let dayIdx = headers.findIndex((h, i) =>
      !claimed.has(i) && (exactMatch(h, ["day", "no", "number", "#", "sr", "serial"]) ||
        (h.length <= 15 && (h === "day no" || h === "day number" || h.startsWith("day ") && h.length < 12)))
    );
    if (dayIdx !== -1) claimed.add(dayIdx);

    // SECTION/PHASE column (highest grouping priority)
    let sectionIdx = -1;
    for (const kw of ["phase", "section", "module", "chapter", "unit", "week", "subject", "category"]) {
      sectionIdx = headers.findIndex((h, i) => !claimed.has(i) && looseMatch(h, [kw]));
      if (sectionIdx !== -1) { claimed.add(sectionIdx); break; }
    }

    // TITLE/TOPIC column (the lesson name)
    let titleIdx = headers.findIndex((h, i) =>
      !claimed.has(i) && looseMatch(h, ["topic", "lesson", "title", "lecture", "content", "description", "name"])
    );
    if (titleIdx !== -1) claimed.add(titleIdx);

    // DURATION column
    let durationIdx = headers.findIndex((h, i) =>
      !claimed.has(i) && looseMatch(h, ["duration", "length", "time", "minutes", "hours", "mins", "hrs"])
    );
    if (durationIdx !== -1) claimed.add(durationIdx);

    // DIFFICULTY/LEVEL column
    let diffIdx = headers.findIndex((h, i) =>
      !claimed.has(i) && looseMatch(h, ["difficulty", "level", "complexity"])
    );
    if (diffIdx !== -1) claimed.add(diffIdx);

    // TECH STACK column
    let techIdx = headers.findIndex((h, i) =>
      !claimed.has(i) && looseMatch(h, ["stack", "tech", "tool", "technology", "language", "framework"])
    );
    if (techIdx !== -1) claimed.add(techIdx);

    // PROJECT MILESTONE column
    let milestoneIdx = headers.findIndex((h, i) =>
      !claimed.has(i) && looseMatch(h, ["milestone", "project milestone", "deliverable", "assignment"])
    );
    if (milestoneIdx !== -1) claimed.add(milestoneIdx);

    // HANDS-ON TASK column (last, broadest match)
    let taskIdx = headers.findIndex((h, i) =>
      !claimed.has(i) && looseMatch(h, ["task", "exercise", "hands-on", "practice", "activity", "project", "lab", "challenge"])
    );
    if (taskIdx !== -1) claimed.add(taskIdx);

    // Resolve sectionIdx/titleIdx conflict — if both map to same column, pick next best for title
    if (sectionIdx !== -1 && sectionIdx === titleIdx) {
      titleIdx = headers.findIndex((h, i) => !claimed.has(i) && i !== sectionIdx);
    }

    // Fallbacks if still not found
    if (sectionIdx === -1) sectionIdx = 0;
    if (titleIdx === -1) titleIdx = grid[headerRowIdx].length > 1 ? (sectionIdx === 0 ? 1 : 0) : 0;

    // Debug log — visible in browser console to help diagnose any future issues
    console.log("[CurriculumParser] Detected columns:", {
      headerRow: headerRowIdx,
      headers,
      day: dayIdx !== -1 ? `[${dayIdx}] "${headers[dayIdx]}"` : "not found",
      section: sectionIdx !== -1 ? `[${sectionIdx}] "${headers[sectionIdx]}"` : "not found",
      title: titleIdx !== -1 ? `[${titleIdx}] "${headers[titleIdx]}"` : "not found",
      duration: durationIdx !== -1 ? `[${durationIdx}] "${headers[durationIdx]}"` : "not found",
      task: taskIdx !== -1 ? `[${taskIdx}] "${headers[taskIdx]}"` : "not found",
      milestone: milestoneIdx !== -1 ? `[${milestoneIdx}] "${headers[milestoneIdx]}"` : "not found",
      tech: techIdx !== -1 ? `[${techIdx}] "${headers[techIdx]}"` : "not found",
      difficulty: diffIdx !== -1 ? `[${diffIdx}] "${headers[diffIdx]}"` : "not found",
    });

    const parsedSections: Section[] = [];
    const sectionMap: { [key: string]: Section } = {};
    const dataRows = grid.slice(headerRowIdx + 1);
    let sectionSort = 1;
    
    // Track previous row's section name to support merged cells / carry forward!
    let prevSectionName = "";

    for (const row of dataRows) {
      if (row.length === 0 || row.every(cell => cell === null || cell === undefined || String(cell).trim() === "")) continue;

      const rawSectionName = String(row[sectionIdx] || "").trim();
      const rawLessonTitle = String(row[titleIdx] || "").trim();
      const rawDay = dayIdx !== -1 ? String(row[dayIdx] || "").trim() : "";
      const rawDuration = durationIdx !== -1 ? String(row[durationIdx] || "").trim() : "10:00";
      
      const rawTask = taskIdx !== -1 ? String(row[taskIdx] || "").trim() : "";
      const rawMilestone = milestoneIdx !== -1 ? String(row[milestoneIdx] || "").trim() : "";
      const rawTech = techIdx !== -1 ? String(row[techIdx] || "").trim() : "";
      const rawDiff = diffIdx !== -1 ? String(row[diffIdx] || "").trim() : "Beginner";

      if (!rawSectionName && !rawLessonTitle) continue;

      // Carry forward / inherit the previous row's section if empty!
      let sectionName = rawSectionName;
      if (!sectionName) {
        sectionName = prevSectionName || "General Introduction";
      } else {
        prevSectionName = sectionName; // update track
      }
      
      let section = sectionMap[sectionName];
      if (!section) {
        section = {
          id: -Date.now() - Math.random(),
          title: sectionName,
          sort_order: sectionSort++,
          lessons: [],
          isExpanded: true,
        };
        sectionMap[sectionName] = section;
        parsedSections.push(section);
      }

      if (rawLessonTitle) {
        // Normalize rawDay to avoid "Day Day 1:" — strip any leading "day" word before building prefix
        const dayNum = rawDay.replace(/^day\s*/i, "").trim();
        const prefix = dayNum && /^\d+$/.test(dayNum) ? `Day ${dayNum}: ` : (rawDay ? `${rawDay}: ` : "");
        const lessonTitle = rawLessonTitle.toLowerCase().startsWith("day ") ? rawLessonTitle : `${prefix}${rawLessonTitle}`;
        
        let duration = rawDuration;
        if (!duration || duration === "—" || duration === "undefined" || duration === "") {
          duration = "10:00";
        }
        
        section.lessons.push({
          id: -Date.now() - Math.random(),
          title: lessonTitle,
          duration: duration,
          sort_order: section.lessons.length + 1,
          hands_on_task: rawTask,
          project_milestone: rawMilestone,
          tech_stack: rawTech,
          difficulty: rawDiff
        });
      }
    }

    setImportedSectionsPreview(parsedSections);
    setIsParsingFile(false);
  };

  const handleUpdateLessonTask = (sectionId: number, lessonId: number, newTask: string) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map(l => (l.id === lessonId ? { ...l, hands_on_task: newTask } : l)),
          };
        }
        return s;
      })
    );
  };

  const handleUpdateLessonMilestone = (sectionId: number, lessonId: number, newMilestone: string) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map(l => (l.id === lessonId ? { ...l, project_milestone: newMilestone } : l)),
          };
        }
        return s;
      })
    );
  };

  const handleUpdateLessonTech = (sectionId: number, lessonId: number, newTech: string) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map(l => (l.id === lessonId ? { ...l, tech_stack: newTech } : l)),
          };
        }
        return s;
      })
    );
  };

  const handleUpdateLessonDifficulty = (sectionId: number, lessonId: number, newDiff: string) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map(l => (l.id === lessonId ? { ...l, difficulty: newDiff } : l)),
          };
        }
        return s;
      })
    );
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    try {
      const reader = new FileReader();
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".csv")) {
        reader.onload = async (evt) => {
          const text = evt.target?.result as string;
          parseCsvContent(text);
        };
        reader.readAsText(file);
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const XLSX = await loadSheetJS();
        reader.onload = async (evt) => {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          setSelectedSheetName(firstSheetName);
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          parseExcelContent(jsonData);
        };
        reader.readAsArrayBuffer(file);
      } else {
        toast.error("Unsupported file format. Please upload a .csv or .xlsx file.");
        setIsParsingFile(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error reading file.");
      setIsParsingFile(false);
    }
  };

  const parseCsvContent = (text: string) => {
    const grid = parseCsvLines(text);
    processCurriculumGrid(grid);
  };

  const parseExcelContent = (grid: any[][]) => {
    processCurriculumGrid(grid);
  };

  const handleApplyImportedCurriculum = () => {
    if (importedSectionsPreview.length === 0) {
      toast.error("No sections to import.");
      return;
    }
    setSections(importedSectionsPreview);
    setShowFileImportModal(false);
    setImportedSectionsPreview([]);
    toast.success("Imported curriculum loaded! Click 'Sync Curriculum' or save to persist to server.");
  };

  const handlePrepopulateTemplate = () => {
    const template: Section[] = [
      {
        id: -1, title: "PHASE 1 — Python Foundations", sort_order: 1, isExpanded: true,
        lessons: [
          { id: -1.01, title: "Day 1: Environment Setup: VS Code, Python install, venv, pip, folder structure", duration: "10:00", sort_order: 1, hands_on_task: "Create venv, install packages, write Hello World script", project_milestone: "—", tech_stack: "Python, VS Code, pip", difficulty: "Beginner" },
          { id: -1.02, title: "Day 2: Variables, Data Types (int/float/str/bool), Type Casting, Comments", duration: "10:00", sort_order: 2, hands_on_task: "Build a simple unit converter (km→miles, kg→lbs)", project_milestone: "—", tech_stack: "Python", difficulty: "Beginner" },
          { id: -1.03, title: "Day 3: Strings: indexing, slicing, methods (upper/lower/strip/split/replace), f-strings", duration: "10:00", sort_order: 3, hands_on_task: "Text formatter: capitalize names, reverse string, count vowels", project_milestone: "—", tech_stack: "Python", difficulty: "Beginner" },
          { id: -1.04, title: "Day 4: Lists, Tuples, Sets, Dictionaries — creation, indexing, CRUD operations", duration: "10:00", sort_order: 4, hands_on_task: "Student grade manager: store names + grades in dict, print sorted list", project_milestone: "—", tech_stack: "Python", difficulty: "Beginner" },
          { id: -1.05, title: "Day 5: Conditions (if/elif/else), Loops (for/while), break/continue/pass, range()", duration: "10:00", sort_order: 5, hands_on_task: "Number guessing game with 5 attempts and hint system", project_milestone: "Start: CLI Contact Book", tech_stack: "Python", difficulty: "Beginner" },
          { id: -1.06, title: "Day 6: Functions: def, parameters, *args, **kwargs, return, scope (local/global)", duration: "10:00", sort_order: 6, hands_on_task: "Write 5 reusable utility functions (validator, formatter, calculator)", project_milestone: "—", tech_stack: "Python", difficulty: "Beginner" },
          { id: -1.07, title: "Day 7: OOP: Classes, Objects, __init__, instance vs class variables, self", duration: "10:00", sort_order: 7, hands_on_task: "Create a BankAccount class with deposit/withdraw/balance methods", project_milestone: "—", tech_stack: "Python", difficulty: "Beginner" },
          { id: -1.08, title: "Day 8: OOP: Inheritance, super(), Polymorphism, Encapsulation, @property", duration: "10:00", sort_order: 8, hands_on_task: "Build Animal → Dog/Cat hierarchy with speak() polymorphism", project_milestone: "—", tech_stack: "Python", difficulty: "Beginner" },
          { id: -1.09, title: "Day 9: File I/O (read/write txt, csv, json), Exception Handling (try/except/finally)", duration: "10:00", sort_order: 9, hands_on_task: "JSON config reader/writer with error handling", project_milestone: "—", tech_stack: "Python", difficulty: "Beginner" },
          { id: -1.10, title: "Day 10: List Comprehensions, Lambda, map/filter/zip, Generators, Modules & Packages", duration: "10:00", sort_order: 10, hands_on_task: "Data pipeline: filter+transform a list using comprehensions & lambda", project_milestone: "✅ DELIVER: CLI Contact Book (OOP + JSON + File I/O)", tech_stack: "Python", difficulty: "Beginner" },
        ]
      },
      {
        id: -2, title: "PHASE 2 — Dev Tools & Version Control", sort_order: 2, isExpanded: true,
        lessons: [
          { id: -2.01, title: "Day 11: Git basics: init, add, commit, status, log, diff, .gitignore, good commit messages", duration: "10:00", sort_order: 1, hands_on_task: "Initialize Git repo for Contact Book, make 5 structured commits", project_milestone: "—", tech_stack: "Git", difficulty: "Beginner" },
          { id: -2.02, title: "Day 12: Git branching: branch, checkout, merge, conflicts resolution, rebase intro", duration: "10:00", sort_order: 2, hands_on_task: "Create feature branch, add a feature, merge back to main", project_milestone: "—", tech_stack: "Git", difficulty: "Beginner" },
          { id: -2.03, title: "Day 13: GitHub: remote, push, pull, clone, fork, pull requests, README writing (Markdown)", duration: "10:00", sort_order: 3, hands_on_task: "Push all Phase 1 projects to GitHub with proper README files", project_milestone: "—", tech_stack: "Git, GitHub, Markdown", difficulty: "Beginner" },
          { id: -2.04, title: "Day 14: Docker: what/why containers, Dockerfile, images, containers, port mapping, volumes", duration: "10:00", sort_order: 4, hands_on_task: "Write Dockerfile for Expense Tracker, build & run container", project_milestone: "—", tech_stack: "Docker", difficulty: "Intermediate" },
          { id: -2.05, title: "Day 15: Docker Compose, environment variables, .env files, multi-container setup basics", duration: "10:00", sort_order: 5, hands_on_task: "Compose file with app + postgres container; .env for secrets", project_milestone: "✅ DELIVER: All projects Dockerized & on GitHub with README", tech_stack: "Docker, Docker Compose", difficulty: "Intermediate" },
        ]
      },
      {
        id: -3, title: "PHASE 3 — Data Science & Machine Learning", sort_order: 3, isExpanded: true,
        lessons: [
          { id: -3.01, title: "Day 16: NumPy: arrays, shape, dtype, operations, broadcasting, indexing/slicing, reshape", duration: "10:00", sort_order: 1, hands_on_task: "Matrix multiplication, normalization, and array stats exercise", project_milestone: "—", tech_stack: "NumPy", difficulty: "Intermediate" },
          { id: -3.02, title: "Day 17: Pandas: DataFrame, Series, read_csv, head/tail/info/describe, loc/iloc", duration: "10:00", sort_order: 2, hands_on_task: "Load Titanic dataset, explore shape, dtypes, missing values", project_milestone: "Start: EDA Report Project", tech_stack: "Pandas", difficulty: "Intermediate" },
          { id: -3.03, title: "Day 18: Data Cleaning: null handling (fillna/dropna), duplicates, dtypes conversion, rename", duration: "10:00", sort_order: 3, hands_on_task: "Clean a messy sales CSV: fix nulls, remove dupes, fix data types", project_milestone: "—", tech_stack: "Pandas", difficulty: "Intermediate" },
          { id: -3.04, title: "Day 19: Data Analysis: groupby, merge/join, pivot_table, value_counts, apply/lambda", duration: "10:00", sort_order: 4, hands_on_task: "Sales analysis: revenue by region, top products, monthly trend", project_milestone: "—", tech_stack: "Pandas", difficulty: "Intermediate" },
          { id: -3.05, title: "Day 20: Visualization: Matplotlib (line/bar/scatter/hist) + Seaborn (heatmap/pairplot/boxplot)", duration: "10:00", sort_order: 5, hands_on_task: "Full EDA: 6 charts on Titanic/Iris with proper titles & labels", project_milestone: "✅ DELIVER: EDA Report — Jupyter Notebook + GitHub", tech_stack: "Matplotlib, Seaborn", difficulty: "Intermediate" },
          { id: -3.06, title: "Day 21: ML Overview: supervised/unsupervised, train/test split, feature engineering, scaling", duration: "10:00", sort_order: 6, hands_on_task: "Identify features & target for 3 datasets; apply StandardScaler", project_milestone: "—", tech_stack: "Scikit-learn", difficulty: "Intermediate" },
          { id: -3.07, title: "Day 22: Linear Regression: theory, sklearn, MSE/RMSE/R², feature importance, prediction", duration: "10:00", sort_order: 7, hands_on_task: "House price predictor: train model, evaluate, visualize predictions", project_milestone: "—", tech_stack: "Scikit-learn", difficulty: "Intermediate" },
          { id: -3.08, title: "Day 23: Logistic Regression, Classification metrics: accuracy, precision, recall, F1, ROC-AUC", duration: "10:00", sort_order: 8, hands_on_task: "Email spam classifier: train, evaluate, plot confusion matrix", project_milestone: "—", tech_stack: "Scikit-learn", difficulty: "Intermediate" },
          { id: -3.09, title: "Day 24: Decision Trees, Random Forest, feature importance, overfitting vs underfitting", duration: "10:00", sort_order: 9, hands_on_task: "Titanic survival predictor with Random Forest + tuning", project_milestone: "—", tech_stack: "Scikit-learn", difficulty: "Intermediate" },
          { id: -3.10, title: "Day 25: Model Evaluation: cross-validation, GridSearchCV, Pipeline, joblib model saving", duration: "10:00", sort_order: 10, hands_on_task: "Build full sklearn Pipeline, save model, load & predict new data", project_milestone: "✅ DELIVER: ML Classification App — CLI + saved model + GitHub", tech_stack: "Scikit-learn, joblib", difficulty: "Intermediate" },
        ]
      },
      {
        id: -4, title: "PHASE 4 — Deep Learning & Computer Vision", sort_order: 4, isExpanded: true,
        lessons: [
          { id: -4.01, title: "Day 26: Neural Network intuition: neurons, layers, weights, biases, activation functions", duration: "10:00", sort_order: 1, hands_on_task: "Draw & annotate a 3-layer NN architecture by hand / in draw.io", project_milestone: "—", tech_stack: "Conceptual", difficulty: "Intermediate" },
          { id: -4.02, title: "Day 27: Keras/TensorFlow: Sequential model, Dense layers, compile (optimizer/loss), fit, evaluate", duration: "10:00", sort_order: 2, hands_on_task: "MNIST digit classifier: build, train, plot accuracy/loss curves", project_milestone: "—", tech_stack: "TensorFlow, Keras", difficulty: "Intermediate" },
          { id: -4.03, title: "Day 28: CNNs: convolution layers, pooling, flatten — concept + small image classifier demo", duration: "10:00", sort_order: 3, hands_on_task: "CIFAR-10 mini CNN: build, train 5 epochs, visualize filters", project_milestone: "—", tech_stack: "TensorFlow, Keras", difficulty: "Intermediate" },
          { id: -4.04, title: "Day 29: NLP basics: tokenization, stemming, TF-IDF, word embeddings, Word2Vec intuition", duration: "10:00", sort_order: 4, hands_on_task: "Tokenize a paragraph, compute TF-IDF matrix, visualize top words", project_milestone: "—", tech_stack: "NLTK, sklearn", difficulty: "Intermediate" },
          { id: -4.05, title: "Day 30: HuggingFace: pipeline API, pre-trained models, tokenizer, inference, model hub", duration: "10:00", sort_order: 5, hands_on_task: "Load sentiment-analysis pipeline, run on 20 movie reviews", project_milestone: "✅ DELIVER: Sentiment Classifier — HuggingFace + GitHub", tech_stack: "HuggingFace Transformers", difficulty: "Intermediate" },
        ]
      },
      {
        id: -5, title: "PHASE 5 — Generative AI & LLMs", sort_order: 5, isExpanded: true,
        lessons: [
          { id: -5.01, title: "Day 31: LLM fundamentals: tokens, context window, temperature, top-p, system/user/assistant roles", duration: "10:00", sort_order: 1, hands_on_task: "Prompt engineering: zero-shot, few-shot, chain-of-thought exercises", project_milestone: "—", tech_stack: "OpenAI / Groq API", difficulty: "Intermediate" },
          { id: -5.02, title: "Day 32: OpenAI/Groq API: setup, chat completions, streaming, error handling, cost awareness", duration: "10:00", sort_order: 2, hands_on_task: "Build a chatbot in 30 lines; test with 10 conversation turns", project_milestone: "Start: AI Personal Assistant", tech_stack: "Python, Groq API", difficulty: "Intermediate" },
          { id: -5.03, title: "Day 33: LangChain: LLMs, ChatModels, PromptTemplate, LLMChain, RunnableSequence (LCEL)", duration: "10:00", sort_order: 3, hands_on_task: "Simple QA chain with custom prompt template", project_milestone: "—", tech_stack: "LangChain", difficulty: "Intermediate" },
          { id: -5.04, title: "Day 34: LangChain Memory: ConversationBufferMemory, ConversationSummaryMemory, history management", duration: "10:00", sort_order: 4, hands_on_task: "Multi-turn chatbot that remembers context for 10+ turns", project_milestone: "—", tech_stack: "LangChain", difficulty: "Intermediate" },
          { id: -5.05, title: "Day 35: LangChain OutputParsers, Pydantic structured output, JSON mode, error correction chains", duration: "10:00", sort_order: 5, hands_on_task: "Build an info extractor: input text → structured JSON (name/date/amount)", project_milestone: "✅ DELIVER: AI Personal Assistant — LangChain + memory + Groq API", tech_stack: "LangChain, Pydantic", difficulty: "Intermediate" },
          { id: -5.06, title: "Day 36: RAG Architecture: why RAG, components overview (Loader→Splitter→Embedder→VectorDB→LLM)", duration: "10:00", sort_order: 6, hands_on_task: "Draw complete RAG architecture diagram with data flow annotations", project_milestone: "Start: PDF Q&A Chatbot", tech_stack: "Conceptual", difficulty: "Intermediate" },
          { id: -5.07, title: "Day 37: Document Loaders (PDF/web/txt/CSV), Text Splitters (RecursiveCharacterTextSplitter)", duration: "10:00", sort_order: 7, hands_on_task: "Load a 20-page PDF, split with 3 different chunk sizes, compare results", project_milestone: "—", tech_stack: "LangChain, PyPDF2", difficulty: "Intermediate" },
          { id: -5.08, title: "Day 38: Embeddings (OpenAI/HuggingFace), Vector Stores (FAISS, ChromaDB), persist & load index", duration: "10:00", sort_order: 8, hands_on_task: "Embed 50 documents, store in Chroma, measure embedding dimensions", project_milestone: "—", tech_stack: "LangChain, ChromaDB, FAISS", difficulty: "Intermediate" },
          { id: -5.09, title: "Day 39: Retrieval strategies: similarity search, MMR, metadata filtering, score thresholds", duration: "10:00", sort_order: 9, hands_on_task: "Compare similarity vs MMR on 5 queries; analyze retrieved chunks", project_milestone: "—", tech_stack: "LangChain, ChromaDB", difficulty: "Intermediate" },
          { id: -5.10, title: "Day 40: Full RAG pipeline: RetrievalQA / ConversationalRetrievalChain, citation sourcing, evaluation", duration: "10:00", sort_order: 10, hands_on_task: "End-to-end RAG on your own PDF: load → embed → retrieve → answer with sources", project_milestone: "✅ DELIVER: PDF Q&A Chatbot — Full RAG + Streamlit UI + GitHub", tech_stack: "LangChain, ChromaDB, Streamlit", difficulty: "Advanced" },
        ]
      },
      {
        id: -6, title: "PHASE 6 — Advanced AI Agents & Deployment", sort_order: 6, isExpanded: true,
        lessons: [
          { id: -6.01, title: "Day 41: Advanced RAG: HyDE (Hypothetical Document Embeddings), query expansion, step-back prompting", duration: "10:00", sort_order: 1, hands_on_task: "Implement HyDE on previous chatbot; compare answer quality before/after", project_milestone: "Start: AI Research Agent", tech_stack: "LangChain", difficulty: "Advanced" },
          { id: -6.02, title: "Day 42: Advanced RAG: Re-ranking (Cohere/CrossEncoder), hybrid search (BM25 + semantic), parent-child chunks", duration: "10:00", sort_order: 2, hands_on_task: "Add re-ranker to RAG pipeline; compare top-5 results with/without it", project_milestone: "—", tech_stack: "LangChain, BM25", difficulty: "Advanced" },
          { id: -6.03, title: "Day 43: RAG Evaluation: RAGAS framework — faithfulness, answer relevancy, context precision/recall", duration: "10:00", sort_order: 3, hands_on_task: "Evaluate Week 8 chatbot with RAGAS on 10 QA pairs; generate report", project_milestone: "—", tech_stack: "RAGAS", difficulty: "Advanced" },
          { id: -6.04, title: "Day 44: LangGraph: StateGraph, nodes, edges, state schema, why graphs > chains for agents", duration: "10:00", sort_order: 4, hands_on_task: "Build a simple 3-node graph: input → process → output with state", project_milestone: "—", tech_stack: "LangGraph", difficulty: "Advanced" },
          { id: -6.05, title: "Day 45: LangGraph: conditional edges, cycles/loops, human-in-the-loop checkpointing, persistence", duration: "10:00", sort_order: 5, hands_on_task: "Build an approval workflow agent: AI drafts → human reviews → revise or approve", project_milestone: "—", tech_stack: "LangGraph", difficulty: "Advanced" },
          { id: -6.06, title: "Day 46: AI Agents: ReAct pattern, tool use, planning, observation loop, agent executor", duration: "10:00", sort_order: 6, hands_on_task: "Manually trace a ReAct loop on paper; then implement with LangChain AgentExecutor", project_milestone: "—", tech_stack: "LangChain Agents", difficulty: "Advanced" },
          { id: -6.07, title: "Day 47: LangChain Tools: built-in (Tavily/DuckDuckGo/Wikipedia) + custom tool creation with @tool", duration: "10:00", sort_order: 7, hands_on_task: "Build a research tool: web_search + calculator + custom weather tool", project_milestone: "—", tech_stack: "LangChain, Tavily API", difficulty: "Advanced" },
          { id: -6.08, title: "Day 48: Multi-agent systems: supervisor pattern, worker agents, LangGraph multi-agent orchestration", duration: "10:00", sort_order: 8, hands_on_task: "Build a 2-agent system: Researcher + Writer, orchestrated by Supervisor", project_milestone: "—", tech_stack: "LangGraph, LangChain", difficulty: "Advanced" },
          { id: -6.09, title: "Day 49: FastAPI: routes, path/query params, request body, Pydantic models, async, dependency injection", duration: "10:00", sort_order: 9, hands_on_task: "Wrap ML classifier as REST API: POST /predict → return prediction + confidence", project_milestone: "—", tech_stack: "FastAPI, Pydantic", difficulty: "Advanced" },
          { id: -6.10, title: "Day 50: Deployment: FastAPI + LangChain + Docker + .env + GitHub Actions CI intro", duration: "10:00", sort_order: 10, hands_on_task: "Dockerize AI Research Agent with FastAPI endpoint; test with Postman/curl", project_milestone: "✅ DELIVER: AI Research Agent — LangGraph + FastAPI + Docker + GitHub", tech_stack: "FastAPI, Docker, LangGraph", difficulty: "Advanced" },
        ]
      },
      {
        id: -7, title: "PHASE 7 — Portfolio, Career & Job Readiness", sort_order: 7, isExpanded: true,
        lessons: [
          { id: -7.01, title: "Day 51: Streamlit: st.chat_message, st.sidebar, file_uploader, session_state, deploy on Streamlit Cloud", duration: "10:00", sort_order: 1, hands_on_task: "Convert PDF Q&A Chatbot to polished Streamlit app with file upload", project_milestone: "Start: Final Capstone Project", tech_stack: "Streamlit", difficulty: "Intermediate" },
          { id: -7.02, title: "Day 52: Final Capstone Planning: architecture design, tech stack decision, GitHub repo setup, task breakdown", duration: "10:00", sort_order: 2, hands_on_task: "Create GitHub repo, write architecture doc, set up project board with issues", project_milestone: "—", tech_stack: "GitHub, Draw.io", difficulty: "Intermediate" },
          { id: -7.03, title: "Day 53: Final Capstone Build Day 1: core pipeline (data ingestion, LLM chain, agent logic)", duration: "10:00", sort_order: 3, hands_on_task: "Core backend working: can process input and return AI output", project_milestone: "—", tech_stack: "LangChain/LangGraph, FastAPI", difficulty: "Advanced" },
          { id: -7.04, title: "Day 54: Final Capstone Build Day 2: UI integration, API endpoints, error handling, loading states", duration: "10:00", sort_order: 4, hands_on_task: "Frontend connected to backend; all happy paths working", project_milestone: "—", tech_stack: "Streamlit/React, FastAPI", difficulty: "Advanced" },
          { id: -7.05, title: "Day 55: Final Capstone Polish: README (badges, demo GIF, architecture diagram), code cleanup, demo video", duration: "10:00", sort_order: 5, hands_on_task: "Push final version to GitHub; record 2-min Loom demo; deploy on Streamlit Cloud", project_milestone: "✅ DELIVER: Final Capstone — Full AI App Deployed + Demo Video", tech_stack: "All Stack", difficulty: "Advanced" },
          { id: -7.06, title: "Day 56: Resume Writing Workshop: AI Engineer resume template, quantified bullet points, ATS optimization", duration: "10:00", sort_order: 6, hands_on_task: "Write resume using template; add bullet points for all 9 portfolio projects", project_milestone: "—", tech_stack: "Canva / Overleaf", difficulty: "Soft Skill" },
          { id: -7.07, title: "Day 57: LinkedIn Optimization: headline formula, about section, featured projects, skills section, posting strategy", duration: "10:00", sort_order: 7, hands_on_task: "Update LinkedIn with new headline, featured section with 3 top projects", project_milestone: "—", tech_stack: "LinkedIn", difficulty: "Soft Skill" },
          { id: -7.08, title: "Day 58: GitHub Portfolio Review: pinned repos, README quality audit, contribution graph, profile README", duration: "10:00", sort_order: 8, hands_on_task: "Audit all 9 repos: add badges, fix READMEs, pin top 6 repos, write profile README", project_milestone: "—", tech_stack: "GitHub", difficulty: "Soft Skill" },
          { id: -7.09, title: "Day 59: Mock Technical Interview: Python OOP, LangChain internals, RAG architecture, LangGraph, system design", duration: "10:00", sort_order: 9, hands_on_task: "Answer 15 technical questions; record yourself; identify weak areas", project_milestone: "—", tech_stack: "Interview Prep", difficulty: "Soft Skill" },
          { id: -7.10, title: "Day 60: Mock HR Interview + Job Search Strategy: salary negotiation, LinkedIn outreach, Upwork profile, local market", duration: "10:00", sort_order: 10, hands_on_task: "Draft cold outreach message; set up Upwork profile; apply to 5 jobs today", project_milestone: "✅ COURSE COMPLETE — Portfolio Ready, Interview Ready, Job Ready! 🎉", tech_stack: "Career Tools", difficulty: "Soft Skill" },
        ]
      },
    ];
    setSections(template);
    toast.success("✅ Loaded complete 60-Day AI Engineer roadmap (7 Phases, 60 lessons)!");
  };

  // ========================================================
  // DOWNLOAD SAMPLE EXCEL TEMPLATE
  // ========================================================
  const handleDownloadSampleTemplate = async () => {
    try {
      toast.info("⬇️ Preparing sample template...");
      const XLSX = await loadSheetJS();

      // Header row
      const headers = [
        "Day", "Week", "Phase", "Topics Covered",
        "Hands-on Task / Exercise", "Project Milestone", "Tech Stack", "Difficulty"
      ];

      // Sample rows — 5 days across 2 phases
      const rows = [
        [1, "Week 1", "PHASE 1 — Foundations", "Environment Setup: install tools, folder structure, Hello World",   "Create virtual environment, install deps, run Hello World", "—", "Python, VS Code", "Beginner"],
        [2, "Week 1", "PHASE 1 — Foundations", "Variables, Data Types, Type Casting, Comments",                     "Build a unit converter (km→miles, kg→lbs)",              "—", "Python",          "Beginner"],
        [3, "Week 1", "PHASE 1 — Foundations", "Conditions, Loops (for/while), break/continue",                   "Number guessing game with 5 attempts",                   "Start: Mini Project", "Python",        "Beginner"],
        [4, "Week 2", "PHASE 2 — Core Skills", "Functions: def, *args, **kwargs, return, scope",                  "Write 5 reusable utility functions",                     "—", "Python",          "Beginner"],
        [5, "Week 2", "PHASE 2 — Core Skills", "OOP: Classes, __init__, inheritance, polymorphism",               "BankAccount class with deposit/withdraw/balance",         "✅ DELIVER: Mini Project v1", "Python", "Intermediate"],
      ];

      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Style column widths for readability
      ws["!cols"] = [
        { wch: 6 },   // Day
        { wch: 8 },   // Week
        { wch: 28 },  // Phase
        { wch: 52 },  // Topics Covered
        { wch: 50 },  // Hands-on Task
        { wch: 38 },  // Project Milestone
        { wch: 20 },  // Tech Stack
        { wch: 14 },  // Difficulty
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Curriculum");
      XLSX.writeFile(wb, "OmniLearn_Curriculum_Template.xlsx");
      toast.success("✅ Sample template downloaded! Fill it in and re-upload.");
    } catch (err) {
      toast.error("Failed to generate template. Try again.");
      console.error(err);
    }
  };


  const handleStartSimulatedUpload = (lessonId: number) => {
    setSelectedLessonId(lessonId);
    setUploadProgress(0);
    
    // Simulate progression
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Save mock video URL and duration
            const mockDurations = ["06:45", "12:30", "08:15", "15:40"];
            const chosenDuration = mockDurations[Math.floor(Math.random() * mockDurations.length)];
            const mockUrl = "https://player.vimeo.com/video/76979871";

            fetch(`${API_BASE_URL}/api/lessons/${lessonId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                duration: chosenDuration,
                media_url: mockUrl,
              }),
            })
              .then(res => res.json())
              .then(json => {
                if (json.success && courseId) {
                  fetchCurriculum(courseId);
                  toast.success("Video attached successfully!");
                }
                setUploadProgress(null);
                setSelectedLessonId(null);
              });
          }, 300);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  // ========================================================
  // STEP 4 ACTIONS: PRICING & PUBLISH
  // ========================================================
  const handlePublishCourse = async () => {
    if (!courseId) return;
    setIsPublishing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parseFloat(price) }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Congratulations! Your course is published!");
        router.push("/");
      } else {
        toast.error(json.error || "Failed to publish course.");
      }
    } catch (err) {
      toast.error("Publishing request failed.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      {/* Background Gradients */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-container/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-6xl w-full mx-auto pb-32">
        {/* Header Title */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-headline-xl text-4xl font-extrabold text-on-surface mb-2">
            Create New Course
          </h1>
          <p className="font-body-lg text-on-surface-variant">
            Design a world-class learning experience for your elite students.
          </p>
        </div>

        {/* Multi-step Stepper Indicator */}
        <div className="glass-panel inner-glow-border rounded-xl p-6 mb-10 shadow-2xl relative overflow-hidden bg-surface-container-lowest/80 backdrop-blur-2xl">
          <div className="flex justify-between items-center relative px-4">
            
            {/* Stepper Progress bar */}
            <div className="absolute left-0 right-0 h-0.5 bg-surface-variant/30 -z-10 mx-10">
              <div
                className="h-full bg-primary-container shadow-[0_0_12px_rgba(252,163,17,0.7)] transition-all duration-500"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              ></div>
            </div>

            {/* Step 1 */}
            <div
              className={`flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${
                currentStep >= 1 ? "opacity-100" : "opacity-40"
              }`}
              onClick={() => courseId && setCurrentStep(1)}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep === 1
                    ? "bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(252,163,17,0.5)] border-2 border-white/20"
                    : currentStep > 1
                    ? "bg-emerald-500 text-white"
                    : "bg-surface-container-high text-on-surface"
                }`}
              >
                {currentStep > 1 ? (
                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                ) : (
                  "1"
                )}
              </div>
              <span className={`font-label-md text-xs ${currentStep === 1 ? "text-primary-container font-bold" : "text-on-surface-variant"}`}>
                Course Info
              </span>
            </div>

            {/* Step 2 */}
            <div
              className={`flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${
                currentStep >= 2 ? "opacity-100" : "opacity-40"
              }`}
              onClick={() => courseId && setCurrentStep(2)}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep === 2
                    ? "bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(252,163,17,0.5)] border-2 border-white/20"
                    : currentStep > 2
                    ? "bg-emerald-500 text-white"
                    : "bg-surface-container-high text-on-surface"
                }`}
              >
                {currentStep > 2 ? (
                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                ) : (
                  "2"
                )}
              </div>
              <span className={`font-label-md text-xs ${currentStep === 2 ? "text-primary-container font-bold" : "text-on-surface-variant"}`}>
                Curriculum
              </span>
            </div>

            {/* Step 3 */}
            <div
              className={`flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${
                currentStep >= 3 ? "opacity-100" : "opacity-40"
              }`}
              onClick={() => courseId && setCurrentStep(3)}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep === 3
                    ? "bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(252,163,17,0.5)] border-2 border-white/20"
                    : currentStep > 3
                    ? "bg-emerald-500 text-white"
                    : "bg-surface-container-high text-on-surface"
                }`}
              >
                {currentStep > 3 ? (
                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                ) : (
                  "3"
                )}
              </div>
              <span className={`font-label-md text-xs ${currentStep === 3 ? "text-primary-container font-bold" : "text-on-surface-variant"}`}>
                Media
              </span>
            </div>

            {/* Step 4 */}
            <div
              className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                currentStep >= 4 ? "opacity-100" : "opacity-40"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep === 4
                    ? "bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(252,163,17,0.5)] border-2 border-white/20"
                    : "bg-surface-container-high text-on-surface"
                }`}
              >
                "4"
              </div>
              <span className={`font-label-md text-xs ${currentStep === 4 ? "text-primary-container font-bold" : "text-on-surface-variant"}`}>
                Pricing
              </span>
            </div>

          </div>
        </div>

        {/* FORM PANEL CONTAINER */}
        <div className="glass-panel inner-glow-border rounded-xl overflow-hidden shadow-2xl bg-surface-container/60 backdrop-blur-3xl border border-white/5">
          
          {/* ========================================================
              STEP 1: COURSE INFO FORM CONTENT
              ======================================================== */}
          {currentStep === 1 && (
            <div className="p-8 md:p-10 space-y-8 animate-fadeIn">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Course Title */}
                <div className="space-y-2">
                  <label className="font-label-md text-sm text-on-surface-variant transition-all font-semibold">
                    Course Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    type="text"
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg px-4 py-3 text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all outline-none"
                    placeholder="e.g. Masterclass in Quantum Cryptography"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="font-label-md text-sm text-on-surface-variant transition-all font-semibold">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg px-4 py-3 text-body-md appearance-none focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                    >
                      <option value="Technology">Technology</option>
                      <option value="Business Strategy">Business Strategy</option>
                      <option value="Fine Arts">Fine Arts</option>
                      <option value="Humanities">Humanities</option>
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-on-surface-variant">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="font-label-md text-sm text-on-surface-variant transition-all font-semibold">
                  Course Description
                </label>
                <div className="bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 p-3 border-b border-outline-variant/30 bg-surface-variant/10">
                    <button type="button" className="p-1.5 hover:bg-surface-bright/20 rounded text-on-surface-variant hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">format_bold</span>
                    </button>
                    <button type="button" className="p-1.5 hover:bg-surface-bright/20 rounded text-on-surface-variant hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">format_italic</span>
                    </button>
                    <button type="button" className="p-1.5 hover:bg-surface-bright/20 rounded text-on-surface-variant hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                    </button>
                    <div className="w-px h-6 bg-outline-variant/30 mx-1"></div>
                    <button type="button" className="p-1.5 hover:bg-surface-bright/20 rounded text-on-surface-variant hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">link</span>
                    </button>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-transparent border-none p-4 text-body-md focus:ring-0 resize-none outline-none"
                    placeholder="Describe the journey and outcomes of this course..."
                    rows={5}
                  ></textarea>
                </div>
              </div>

              {/* Thumbnail Selector */}
              <div className="space-y-3">
                <label className="font-label-md text-sm text-on-surface-variant transition-all font-semibold block">
                  Course Thumbnail
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {mockThumbnails.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setThumbnailUrl(url)}
                      className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 active:scale-95 ${
                        thumbnailUrl === url ? "border-primary-container shadow-[0_0_12px_rgba(252,163,17,0.5)]" : "border-transparent opacity-65"
                      }`}
                    >
                      <img src={url} alt={`Mock Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      {thumbnailUrl === url && (
                        <div className="absolute inset-0 bg-primary-container/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white font-bold bg-primary-container/80 p-1 rounded-full text-sm">check</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-2 border-dashed border-outline-variant/40 rounded-lg p-8 flex flex-col items-center justify-center gap-4 bg-surface-variant/5 hover:bg-surface-variant/10 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary-container group-hover:scale-115 transition-transform">
                    <span className="material-symbols-outlined text-[28px]">upload_file</span>
                  </div>
                  <div className="text-center">
                    <p className="font-body-md text-on-surface font-semibold text-sm">Custom upload mock trigger</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">High-fidelity 16:9 PNG or JPG (max. 2MB)</p>
                  </div>
                </div>
              </div>

              {/* Form Footer Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
                <button
                  type="button"
                  onClick={handleSaveCourseInfo}
                  disabled={isSubmittingInfo}
                  className="px-6 py-3 rounded-lg border border-outline-variant/30 text-on-surface font-label-md hover:bg-surface-variant/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-sm"
                >
                  {isSubmittingInfo ? "Saving..." : "Save Draft"}
                </button>
                <button
                  type="button"
                  onClick={handleNextStep1}
                  disabled={isSubmittingInfo}
                  className="px-8 py-3 rounded-lg bg-primary-container text-on-primary-container font-label-md font-bold shadow-lg shadow-primary-container/20 hover:shadow-primary-container/40 hover:translate-y-[-2px] transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-sm"
                >
                  Next Step: Curriculum
                </button>
              </div>

            </div>
          )}

          {/* ========================================================
              STEP 2: CURRICULUM BUILDER CONTENT
              ======================================================== */}
          {currentStep === 2 && (
            <div className="p-8 md:p-10 space-y-8 animate-fadeIn">
              
              {/* Premium Import / Action Toolbar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* AI / Spreadsheet Importer Card */}
                <div
                  onClick={() => setShowFileImportModal(true)}
                  className="border-2 border-dashed border-primary-container/30 hover:border-primary-container rounded-xl p-6 flex items-center gap-4 bg-primary-container/5 hover:bg-primary-container/10 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      upload_file
                    </span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white mb-0.5 flex items-center gap-1.5">
                      Import Excel / CSV
                      <span className="text-[10px] bg-primary-container/20 text-primary-container px-2 py-0.5 rounded-full font-bold uppercase">Popular</span>
                    </h3>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed max-w-sm">
                      Upload `.xlsx` or `.csv` outlines (like `AI roadmap.xlsx`). Our system auto-groups sections & lessons instantly!
                    </p>
                  </div>
                </div>

                {/* AI Quick Templates Card */}
                <div
                  onClick={handlePrepopulateTemplate}
                  className="border-2 border-dashed border-emerald-500/20 hover:border-emerald-500/50 rounded-xl p-6 flex items-center gap-4 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      auto_awesome
                    </span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white mb-0.5">Pre-populate Roadmap Template</h3>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed max-w-sm">
                      Don't want to type? Click here to instantly load a gorgeous 12-week AI Engineer training roadmap template.
                    </p>
                  </div>
                </div>

              </div>

              {/* Manual Builder Section */}
              <div className="space-y-6">
                
                {/* Builder Header & Local Controls */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div>
                    <h3 className="font-headline-lg text-lg font-bold text-primary-container flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">edit_note</span>
                      Interactive Curriculum Builder
                    </h3>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Customize sections, reorder topics, and set lesson durations with zero latency.
                    </p>
                  </div>
                  
                  {/* Toolkit buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="flex items-center gap-1 text-[11px] text-primary-container border border-primary-container/30 px-3.5 py-1.5 rounded-full hover:bg-primary-container/10 transition-all font-bold cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">add</span>
                      Add Section
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveCurriculum(true)}
                      disabled={isImporting}
                      className="flex items-center gap-1 text-[11px] text-white bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full hover:bg-white/10 transition-all font-bold cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-xs">sync</span>
                      {isImporting ? "Saving..." : "Sync Curriculum"}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllCurriculum}
                      className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 border border-red-500/20 px-3.5 py-1.5 rounded-full hover:bg-red-500/10 transition-all font-bold cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">delete_sweep</span>
                      Clear All
                    </button>
                  </div>
                </div>

                {sections.length === 0 ? (
                  <div className="border border-outline-variant/10 rounded-xl p-16 text-center text-on-surface-variant bg-surface-container-low/20">
                    <span className="material-symbols-outlined text-5xl mb-3 block text-primary-container animate-pulse">
                      playlist_add
                    </span>
                    <p className="font-semibold text-white text-sm">Your Curriculum is Empty</p>
                    <p className="text-xs text-on-surface-variant mt-1.5 max-w-sm mx-auto">
                      Get started by importing an Excel/CSV file, pre-populating our industry standard template, or adding custom sections manually.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sections.map((section, sIdx) => (
                      <div
                        key={section.id}
                        className="glass-panel rounded-lg overflow-hidden border border-white/5 bg-white/5 transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                      >
                        {/* Section Header */}
                        <div className="p-4 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-all border-b border-white/5 gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="material-symbols-outlined text-on-surface-variant cursor-grab select-none">
                              drag_indicator
                            </span>
                            <span className="text-xs font-mono font-bold text-primary-container px-2 py-0.5 bg-primary-container/10 rounded">
                              S{sIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => handleUpdateSectionTitle(section.id!, e.target.value)}
                              className="bg-transparent border-none text-white text-sm md:text-base font-bold outline-none focus:border-b focus:border-primary-container pb-0.5 w-full cursor-text truncate"
                              placeholder="e.g. Section Title"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            
                            {/* Reorder Section */}
                            <button
                              type="button"
                              onClick={() => handleMoveSection(sIdx, "up")}
                              disabled={sIdx === 0}
                              className="p-1 hover:bg-white/10 rounded text-on-surface-variant disabled:opacity-30 transition-all"
                              title="Move Section Up"
                            >
                              <span className="material-symbols-outlined text-sm font-bold">arrow_upward</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSection(sIdx, "down")}
                              disabled={sIdx === sections.length - 1}
                              className="p-1 hover:bg-white/10 rounded text-on-surface-variant disabled:opacity-30 transition-all"
                              title="Move Section Down"
                            >
                              <span className="material-symbols-outlined text-sm font-bold">arrow_downward</span>
                            </button>

                            <div className="w-px h-5 bg-white/10 mx-1"></div>

                            <button
                              type="button"
                              onClick={() => {
                                setSections(
                                  sections.map(s =>
                                    s.id === section.id ? { ...s, isExpanded: !s.isExpanded } : s
                                  )
                                );
                              }}
                              className="p-1.5 hover:bg-white/10 rounded transition-colors text-on-surface-variant hover:text-white"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {section.isExpanded ? "expand_less" : "expand_more"}
                              </span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(section.id!)}
                              className="p-1.5 hover:bg-red-500/10 rounded transition-colors text-on-surface-variant hover:text-red-400"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Section Lessons */}
                        {section.isExpanded && (
                          <div className="p-4 space-y-2 bg-black/20">
                            {section.lessons.map((lesson, lIdx) => (
                              <div key={lesson.id} className="space-y-2">
                                <div
                                  className="bg-surface-variant/10 border border-white/5 p-3 rounded-lg flex items-center justify-between hover:border-primary-container/20 hover:bg-surface-variant/20 transition-all group gap-4"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="material-symbols-outlined text-on-surface-variant text-base flex-shrink-0 select-none">
                                      play_circle
                                    </span>
                                    <span className="text-[10px] font-mono text-on-surface-variant bg-white/5 px-1.5 py-0.5 rounded flex-shrink-0 select-none">
                                      L{lIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={lesson.title}
                                      onChange={(e) => handleUpdateLessonTitle(section.id!, lesson.id!, e.target.value)}
                                      className="bg-transparent border-none text-white text-xs md:text-sm outline-none focus:border-b focus:border-primary-container w-full cursor-text truncate"
                                      placeholder="e.g. Lesson Topic / Day Content"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    
                                    {/* Expandable Customization Settings button */}
                                    <button
                                      type="button"
                                      onClick={() => setExpandedLessonId(expandedLessonId === lesson.id ? null : lesson.id!)}
                                      className={`p-1 rounded text-on-surface-variant hover:text-primary-container hover:bg-white/5 transition-all ${
                                        expandedLessonId === lesson.id ? "text-primary-container bg-primary-container/10" : ""
                                      }`}
                                      title="Customize Lesson Details"
                                    >
                                      <span className="material-symbols-outlined text-sm font-bold">tune</span>
                                    </button>

                                    {/* Sort control arrows */}
                                    <div className="flex items-center">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveLesson(section.id!, lIdx, "up")}
                                        disabled={lIdx === 0}
                                        className="p-1 hover:bg-white/10 rounded text-on-surface-variant disabled:opacity-30 transition-all"
                                        title="Move Lesson Up"
                                      >
                                        <span className="material-symbols-outlined text-sm">keyboard_arrow_up</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveLesson(section.id!, lIdx, "down")}
                                        disabled={lIdx === section.lessons.length - 1}
                                        className="p-1 hover:bg-white/10 rounded text-on-surface-variant disabled:opacity-30 transition-all"
                                        title="Move Lesson Down"
                                      >
                                        <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLesson(section.id!, lesson.id!)}
                                      className="p-1 hover:bg-red-500/10 rounded text-on-surface-variant hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Rich Collapsible Enterprise Customization Panel */}
                                {expandedLessonId === lesson.id && (
                                  <div className="bg-black/35 border border-white/5 p-4 rounded-lg space-y-4 animate-fadeIn ml-6 relative overflow-hidden">
                                    <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 mb-2">
                                      <span className="material-symbols-outlined text-primary-container text-xs">tune</span>
                                      <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">Customize Lesson Details</h5>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Tech Stack Input */}
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Tech Stack</label>
                                        <input
                                          type="text"
                                          value={lesson.tech_stack || ""}
                                          onChange={(e) => handleUpdateLessonTech(section.id!, lesson.id!, e.target.value)}
                                          className="w-full bg-surface-container-lowest/50 border border-outline-variant/20 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary-container transition-all"
                                          placeholder="e.g. Python, Docker, PyTorch"
                                        />
                                      </div>

                                      {/* Difficulty dropdown */}
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Difficulty Level</label>
                                        <select
                                          value={lesson.difficulty || "Beginner"}
                                          onChange={(e) => handleUpdateLessonDifficulty(section.id!, lesson.id!, e.target.value)}
                                          className="w-full bg-surface-container-lowest/50 border border-outline-variant/20 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary-container transition-all"
                                        >
                                          <option value="Beginner">Beginner</option>
                                          <option value="Intermediate">Intermediate</option>
                                          <option value="Advanced">Advanced</option>
                                          <option value="Soft Skill">Soft Skill</option>
                                        </select>
                                      </div>
                                    </div>

                                    {/* Hands-on Task / Exercise */}
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Hands-on Task / Exercise</label>
                                      <textarea
                                        value={lesson.hands_on_task || ""}
                                        onChange={(e) => handleUpdateLessonTask(section.id!, lesson.id!, e.target.value)}
                                        rows={2}
                                        className="w-full bg-surface-container-lowest/50 border border-outline-variant/20 rounded p-2.5 text-xs text-white outline-none focus:border-primary-container resize-none transition-all"
                                        placeholder="e.g. Build a simple unit converter (km -> miles), practice OOP concepts"
                                      ></textarea>
                                    </div>

                                    {/* Project Milestone */}
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Project Milestone</label>
                                      <input
                                        type="text"
                                        value={lesson.project_milestone || ""}
                                        onChange={(e) => handleUpdateLessonMilestone(section.id!, lesson.id!, e.target.value)}
                                        className="w-full bg-surface-container-lowest/50 border border-outline-variant/20 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary-container transition-all"
                                        placeholder="e.g. ✅ DELIVER: CLI Contact Book or —"
                                      />
                                    </div>

                                    {/* Duration editor box */}
                                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded border border-white/5 max-w-xs">
                                      <span className="material-symbols-outlined text-[13px] text-on-surface-variant">schedule</span>
                                      <span className="text-[10px] text-on-surface-variant font-semibold">Standard Duration:</span>
                                      <input
                                        type="text"
                                        value={lesson.duration}
                                        onChange={(e) => handleUpdateLessonDuration(section.id!, lesson.id!, e.target.value)}
                                        className="bg-black/30 border border-white/10 rounded text-center font-mono text-[10px] text-white w-14 outline-none p-1 focus:ring-1 focus:ring-primary-container"
                                        placeholder="10:00"
                                      />
                                    </div>
                                    
                                  </div>
                                )}
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => handleAddLesson(section.id!)}
                              className="ml-1.5 mt-2 flex items-center gap-1 text-[11px] text-primary-container hover:text-cream-accent hover:translate-x-1 transition-all font-semibold cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">add_circle</span>
                              Add Lesson
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Footer Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 rounded-lg border border-outline-variant/30 text-on-surface font-label-md hover:bg-surface-variant/20 transition-all active:scale-95 cursor-pointer text-sm font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep2}
                  className="px-8 py-3 rounded-lg bg-primary-container text-on-primary-container font-label-md font-bold shadow-lg shadow-primary-container/20 hover:shadow-primary-container/40 hover:translate-y-[-2px] transition-all active:scale-95 cursor-pointer text-sm flex items-center gap-1"
                >
                  Next Step: Media
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </button>
              </div>

            </div>
          )}

          {/* ========================================================
              STEP 3: MEDIA UPLOAD MANAGER CONTENT
              ======================================================== */}
          {currentStep === 3 && (
            <div className="p-8 md:p-10 space-y-8 animate-fadeIn">
              <div>
                <h3 className="font-headline-lg text-xl font-bold text-primary-container mb-2">
                  Attach Lesson Media
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Select a lesson below to upload and link class video materials. Videos will automatically determine standard duration.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Curriculum Lesson Tree (Left 1/3) */}
                <div className="md:col-span-1 border border-outline-variant/20 rounded-xl p-4 bg-black/20 max-h-[380px] overflow-y-auto custom-scrollbar">
                  <h4 className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-3">Curriculum Index</h4>
                  {sections.length === 0 ? (
                    <p className="text-xs text-on-surface-variant italic">No sections created yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {sections.map(s => (
                        <div key={s.id} className="space-y-1">
                          <p className="text-xs text-primary font-bold truncate">{s.title}</p>
                          <div className="pl-2 space-y-1">
                            {s.lessons.map(l => (
                              <div
                                key={l.id}
                                onClick={() => setSelectedLessonId(l.id!)}
                                className={`p-2 rounded text-xs cursor-pointer truncate transition-all ${
                                  selectedLessonId === l.id
                                    ? "bg-primary-container/20 border-l-2 border-primary-container text-white font-bold"
                                    : "text-on-surface-variant hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                {l.title} {l.media_url && "✅"}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload Workspace (Right 2/3) */}
                <div className="md:col-span-2 border border-outline-variant/20 rounded-xl p-6 bg-black/10 flex flex-col justify-center min-h-[300px]">
                  {selectedLessonId ? (
                    (() => {
                      const activeLesson = sections.flatMap(s => s.lessons).find(l => l.id === selectedLessonId);
                      if (!activeLesson) return null;

                      return (
                        <div className="text-center space-y-6">
                          <h4 className="text-base font-bold text-white">Uploading media for:</h4>
                          <p className="text-sm text-primary font-semibold truncate bg-white/5 px-4 py-2 rounded-lg max-w-md mx-auto">
                            {activeLesson.title}
                          </p>

                          {uploadProgress !== null ? (
                            <div className="max-w-xs mx-auto space-y-3">
                              {/* Simple Circular Progress Simulator */}
                              <div className="w-16 h-16 rounded-full border-4 border-surface-container-high border-t-primary-container animate-spin mx-auto"></div>
                              <p className="text-sm font-semibold font-mono text-primary-container">{uploadProgress}% uploaded...</p>
                            </div>
                          ) : activeLesson.media_url ? (
                            <div className="space-y-4">
                              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                                <span className="material-symbols-outlined text-[32px]">check_circle</span>
                              </div>
                              <p className="text-sm text-on-surface-variant font-semibold">Video preview attached successfully!</p>
                              <div className="flex justify-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleStartSimulatedUpload(activeLesson.id!)}
                                  className="px-4 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold rounded-full cursor-pointer text-white transition-colors"
                                >
                                  Reupload Video
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => handleStartSimulatedUpload(activeLesson.id!)}
                              className="border-2 border-dashed border-outline-variant/30 rounded-lg p-8 flex flex-col items-center justify-center gap-4 bg-surface-variant/5 hover:bg-surface-variant/10 transition-all cursor-pointer group"
                            >
                              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary-container group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[28px]">movie</span>
                              </div>
                              <div className="text-center">
                                <p className="font-body-md text-on-surface font-semibold text-sm">Simulate MP4/WebM Upload</p>
                                <p className="text-[11px] text-on-surface-variant mt-1">Recommended resolution: 1080p (max. 100MB)</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center text-on-surface-variant space-y-3">
                      <span className="material-symbols-outlined text-4xl text-outline block">
                        touch_app
                      </span>
                      <p className="font-semibold text-sm">Select a lesson from index to continue.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Form Footer Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 rounded-lg border border-outline-variant/30 text-on-surface font-label-md hover:bg-surface-variant/20 transition-all active:scale-95 cursor-pointer text-sm"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-8 py-3 rounded-lg bg-primary-container text-on-primary-container font-label-md font-bold shadow-lg shadow-primary-container/20 hover:shadow-primary-container/40 hover:translate-y-[-2px] transition-all active:scale-95 cursor-pointer text-sm"
                >
                  Next Step: Pricing
                </button>
              </div>

            </div>
          )}

          {/* ========================================================
              STEP 4: PRICING & REVIEW PUBLISH CONTENT
              ======================================================== */}
          {currentStep === 4 && (
            <div className="p-8 md:p-10 space-y-8 animate-fadeIn">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Course Card Live Preview (Left 5/12) */}
                <div className="lg:col-span-5 space-y-3">
                  <h4 className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Dynamic Live Card Preview</h4>
                  
                  {/* Dynamic Rendering Card */}
                  <div className="glass-card rounded-lg overflow-hidden flex flex-col group border border-white/10 hover:shadow-[0_0_20px_rgba(252,163,17,0.15)] transition-all duration-300">
                    <div className="h-44 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                      <img
                        className="w-full h-full object-cover"
                        src={thumbnailUrl}
                        alt="Course Thumbnail Preview"
                      />
                      <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                        <span className="px-3 py-1 bg-gold-accent text-black text-[10px] font-bold uppercase rounded-full tracking-wider">
                          {category}
                        </span>
                        <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                          {sections.flatMap(s => s.lessons).length} Lessons
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1 bg-surface-container-low/20">
                      <h3 className="text-base font-bold text-white mb-2 truncate">
                        {title || "Untitled Course"}
                      </h3>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mb-4">
                        {description || "No description provided yet."}
                      </p>
                      
                      <div className="mt-auto flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-lg font-extrabold text-white font-mono">
                          ${parseFloat(price).toFixed(2)}
                        </span>
                        <span className="text-xs bg-primary-container/20 text-primary-container px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                          Live Preview
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Configurations (Right 7/12) */}
                <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-headline-lg text-xl font-bold text-white mb-1">
                        Pricing & Availability
                      </h3>
                      <p className="text-xs text-on-surface-variant">Configure standard pricing and release details before launching.</p>
                    </div>

                    {/* Price Input */}
                    <div className="space-y-2 max-w-xs">
                      <label className="font-label-md text-xs text-on-surface-variant font-semibold">Standard Cost (USD)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant font-mono text-sm">$</span>
                        <input
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg pl-8 pr-4 py-3 text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container font-mono outline-none text-sm"
                        />
                      </div>
                    </div>

                    {/* Simple summary checklist */}
                    <div className="p-4 rounded-lg bg-surface-container-lowest/30 border border-outline-variant/20 space-y-2">
                      <h5 className="text-xs text-white font-bold uppercase tracking-wide mb-1">Course Summary</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant">
                        <p>Total Sections: <span className="text-white font-bold">{sections.length}</span></p>
                        <p>Total Lessons: <span className="text-white font-bold">{sections.flatMap(s => s.lessons).length}</span></p>
                        <p>Thumbnail: <span className="text-emerald-400 font-bold">Configured</span></p>
                        <p>Price Point: <span className="text-primary-container font-bold">${price}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Form Footer Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-6 py-3 rounded-lg border border-outline-variant/30 text-on-surface font-label-md hover:bg-surface-variant/20 transition-all active:scale-95 cursor-pointer text-sm"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handlePublishCourse}
                      disabled={isPublishing}
                      className="px-10 py-3 rounded-lg bg-gradient-to-r from-primary-container to-amber-500 text-on-primary-container font-label-md font-bold shadow-lg shadow-primary-container/40 hover:shadow-primary-container/60 hover:scale-105 transition-all active:scale-95 cursor-pointer text-sm flex items-center gap-1.5 border border-white/10"
                    >
                      {isPublishing ? "Publishing..." : "Publish Course"}
                      <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

        {/* Dynamic Context Tips */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-lg inner-glow-border bg-white/5 border border-white/5">
            <span className="material-symbols-outlined text-primary-container mb-3 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              lightbulb
            </span>
            <h4 className="font-label-md text-on-surface font-bold mb-2">Engaging Titles</h4>
            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              Courses with clear, outcome-based titles see a 40% higher enrollment rate among elite learners.
            </p>
          </div>
          <div className="glass-panel p-6 rounded-lg inner-glow-border bg-white/5 border border-white/5">
            <span className="material-symbols-outlined text-primary-container mb-3 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              visibility
            </span>
            <h4 className="font-label-md text-on-surface font-bold mb-2">Visual Impact</h4>
            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              High-resolution thumbnails (1920x1080) communicate prestige and technological sophistication.
            </p>
          </div>
          <div className="glass-panel p-6 rounded-lg inner-glow-border bg-white/5 border border-white/5">
            <span className="material-symbols-outlined text-primary-container mb-3 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock_open
            </span>
            <h4 className="font-label-md text-on-surface font-bold mb-2">Early Access</h4>
            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              You can publish as 'In Development' to start building a waitlist before the content is finalized.
            </p>
          </div>
        </div>
      </div>

      {/* Paste CSV Text Importer Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="glass-panel inner-glow-border rounded-xl p-6 max-w-lg w-full bg-surface-container border border-white/10 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary-container font-bold">article</span>
                Paste Raw CSV Text Importer
              </h4>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 hover:bg-white/10 rounded text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-on-surface-variant font-semibold">Paste CSV Outline (Section, Lesson, Duration)</label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={8}
                className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg p-3 text-xs font-mono focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none text-white resize-none"
                placeholder="Section 1: Foundations, Lesson 1.1: System Models, 10:30&#10;Section 1: Foundations, Lesson 1.2: Topology, 14:15&#10;Section 2: Architecture, Lesson 2.1: Message Broker, 08:20"
              ></textarea>
            </div>

            <div className="flex justify-between items-center pt-2">
              <p className="text-[10px] text-on-surface-variant italic">Format: Section, Lesson Name, Duration (e.g. 10:00)</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-xs cursor-pointer text-on-surface-variant hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCsvImport}
                  className="px-5 py-2 bg-primary-container text-on-primary-container rounded-lg text-xs font-bold cursor-pointer hover:bg-primary-container/90"
                >
                  Parse & Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Excel & CSV Smart File Importer Modal */}
      {showFileImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="glass-panel inner-glow-border rounded-xl p-6 max-w-2xl w-full bg-surface-container border border-white/10 space-y-6 my-8 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-primary-container/10 flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>table_chart</span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Smart Spreadsheet Importer</h4>
                  <p className="text-[10px] text-on-surface-variant">Auto-parse curriculum roadmaps from custom files</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowFileImportModal(false);
                  setImportedSectionsPreview([]);
                }}
                className="p-1 hover:bg-white/10 rounded text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Main Modal Content Split */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Upload or Preview (7/12) */}
              <div className="md:col-span-7 space-y-4">
                
                {importedSectionsPreview.length === 0 ? (
                  /* File Upload Drop Zone */
                  <div className="space-y-4">
                    <label className="border-2 border-dashed border-outline-variant/30 hover:border-primary-container rounded-lg p-10 flex flex-col items-center justify-center gap-4 bg-surface-variant/5 hover:bg-surface-variant/10 transition-all cursor-pointer group text-center">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {isParsingFile ? (
                        <div className="space-y-3">
                          <div className="w-10 h-10 rounded-full border-4 border-surface-container-high border-t-primary-container animate-spin mx-auto"></div>
                          <p className="text-xs font-semibold text-primary-container">Reading & grouping roadmap columns...</p>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary-container group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                          </div>
                          <div>
                            <p className="font-body-md text-white font-semibold text-sm">Select Excel (.xlsx) or CSV file</p>
                            <p className="text-[11px] text-on-surface-variant mt-1">Accepts roadmaps formatted like `AI roadmap.xlsx`</p>
                          </div>
                        </>
                      )}
                    </label>

                    {/* Or paste CSV text button */}
                    <div className="text-center">
                      <span className="text-[10px] text-on-surface-variant">or want to paste outline instead? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFileImportModal(false);
                          setShowImportModal(true);
                        }}
                        className="text-[10px] text-primary-container font-bold underline hover:text-amber-400 cursor-pointer"
                      >
                        Paste CSV Text
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Interactive Import Tree Preview */
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-bold text-primary-container uppercase tracking-wider">
                        ROADMAP IMPORT PREVIEW ({selectedSheetName ? `Sheet: ${selectedSheetName}` : 'CSV'})
                      </h5>
                      <button
                        type="button"
                        onClick={() => setImportedSectionsPreview([])}
                        className="text-[10px] text-red-400 font-bold hover:underline"
                      >
                        Reset Upload
                      </button>
                    </div>

                    <div className="border border-outline-variant/20 rounded-xl p-3 bg-black/30 max-h-[250px] overflow-y-auto custom-scrollbar space-y-3">
                      {importedSectionsPreview.map((s, sIdx) => (
                        <div key={s.id} className="space-y-1">
                          <p className="text-xs font-bold text-white flex items-center gap-1">
                            <span className="text-[9px] bg-primary-container/20 text-primary-container px-1 py-0.5 rounded font-mono">S{sIdx + 1}</span>
                            {s.title}
                          </p>
                          <div className="pl-3 border-l border-white/5 space-y-1">
                            {s.lessons.map((l, lIdx) => (
                              <p key={l.id} className="text-[10px] text-on-surface-variant truncate flex items-center justify-between">
                                <span>L{lIdx + 1}: {l.title}</span>
                                <span className="font-mono text-[9px] bg-white/5 px-1 rounded flex-shrink-0 ml-2">{l.duration}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Visual Layout Guidance & Specifications (5/12) */}
              <div className="md:col-span-5 border-l border-white/10 md:pl-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-amber-400">info</span>
                    Column Mapping Guide
                  </h5>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Our smart import parser automatically detects headers in your Excel sheet or CSV and maps them logically:
                  </p>

                  <div className="bg-black/30 rounded border border-white/5 p-2 space-y-2 text-[9px] font-mono text-on-surface-variant">
                    <p className="text-white border-b border-white/5 pb-1 flex justify-between font-bold">
                      <span>Header In File</span>
                      <span>Maps To</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Phase / Week / Module</span>
                      <span className="text-emerald-400 font-bold">Course Sections</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Topics Covered / Title</span>
                      <span className="text-primary-container font-bold">Lesson Titles</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Day / Unit Number</span>
                      <span className="text-cream-accent font-bold">Prefixes Title</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Duration / Time</span>
                      <span className="text-purple-400 font-bold">Lesson Duration</span>
                    </p>
                  </div>

                  <p className="text-[9px] text-on-surface-variant italic leading-relaxed">
                    💡 <strong>Tip:</strong> If your sheet is structured day-by-day (like the `AI roadmap.xlsx`), the parser will group the lessons seamlessly.
                  </p>

                  {/* Download Sample Template CTA */}
                  <button
                    type="button"
                    onClick={handleDownloadSampleTemplate}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-500/60 text-emerald-400 transition-all text-[11px] font-bold group"
                  >
                    <span className="material-symbols-outlined text-sm group-hover:animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
                    Download Sample .xlsx Template
                  </button>
                  <p className="text-[9px] text-on-surface-variant/60 text-center">
                    Fill in the downloaded file &amp; re-upload here
                  </p>
                </div>

                {/* Import Apply CTA */}
                {importedSectionsPreview.length > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyImportedCurriculum}
                    className="w-full py-3 bg-gradient-to-r from-primary-container to-amber-500 text-on-primary-container rounded-lg text-xs font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border border-white/10"
                  >
                    <span className="material-symbols-outlined text-xs">done_all</span>
                    Apply to Curriculum Builder
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
