# Navigation Analysis - RESOLVED

## Finding
The /become-a-tech route works correctly - it shows the "Operator → Maintenance Tech" career program page.
The page has 6 stages with items that link to courses and labs.

## User's Complaint
The user said "how do i click on become a tech and instead it sends me to the simulator"
Looking at the screenshot they provided, they were ON the lab page (showing the ladder diagram).

## Root Cause
The user was likely already on the /labs page (from clicking "Diagnose a Fault") and confused which nav link they clicked.
OR: The "Become a Tech" page items (like "Conveyor Troubleshooting Lab") navigate to /labs when clicked.

## The REAL Problem
The user is saying the "Become a Tech" page doesn't make sense as a concept. They click it expecting 
a learning path/courses page, but instead it's a program outline where clicking items sends you to labs/simulator.
The page IS the program outline but the items within it navigate to labs.

## Fix Needed
1. The "Become a Tech" page itself is fine - it's a career program
2. But the user experience is confusing because:
   - The page title "Operator → Maintenance Tech" is unclear from the nav label "Become a Tech"
   - Clicking items within the page sends you to /labs (the simulator)
   - The user expected "Become a Tech" to be a learning/courses experience, not a program that links to the simulator

## Solution
Make "Become a Tech" go to /courses (the actual learning content) instead of /become-a-tech.
The career program page can still exist but shouldn't be the primary nav destination.
OR: Rename the nav link to something clearer like "Learning Path" or "Courses"
