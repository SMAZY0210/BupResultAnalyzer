# BUP Result Analyser

A single HTML file that reads a published BUP tabulation sheet and works out what the sheet does not tell you directly: where each student sits, which course sank people, and how the class actually splits.

Drop in one or more `.xlsx` result sheets and it renders ten sections of analysis. No install, no server, no build step.

---

## Running it

Open `bup-result-analyser.html` in any modern browser. That is the whole setup.

Click the drop zone or drag result files onto it. Several at once is fine, and each one gets its own tab across the top.

Parsing happens in your browser using SheetJS. Nothing is uploaded and no result data leaves the machine.

One caveat on the word "offline": the page pulls SheetJS and the IBM Plex fonts from a CDN, so the very first load needs a network connection. After that the browser cache usually covers you. If you want it truly self contained, see [Vendoring the dependencies](#vendoring-the-dependencies) below.

---

## What it reads

BUP publishes results in two layouts and both work:

1. The bare `RptTabulationSheet` export, where the header row sits at the top with no title.
2. The departmental sheets that carry a banner first (`BA (Hons), ENG-2024, 5th Sem Jan-Jun 2026`) with Appeared and Passed counts and an RPD date.

The parser does not assume a fixed row offset. It hunts for the row containing `Ser` and `Student's Name` and builds its column map from there, so extra banner rows or a missing title do not break it.

### Quirks it handles

Sheets that look tidy have some awkward corners:

- **Left packed course blocks.** A student who sat fewer papers has their course blocks pushed left, but the semester summary and CGPA columns stay where the header puts them. Reading by header position alone gives you nonsense for those rows.
- **Retake entries mixed into the course list.** A single student resitting `GED1113` and failing it will look like the hardest course on the sheet if you count naively. Courses that fewer than a quarter of the class sat are split into a separate table.
- **`AB` is not `F`.** Both are worth 0.00 grade points, but absent and failed are different things, so they are counted separately throughout.
- **Untitled sheets.** Where no title is printed, one is built from the data: the dominant course prefix, the batch, and how many semesters are shown. Service courses like GED, MATH and PHY are excluded from that guess, otherwise an ICE sheet gets labelled GED.
- **RPD dates in two places.** Sometimes beside the label, sometimes in the row below it.
- **Course titles.** Pulled out of the footer line and matched back to their codes, so `ENG4012` shows as Second Language Acquisition in the tables.

### Grading scale

Taken from what the sheets themselves print:

| Grade | GP | | Grade | GP |
|---|---|---|---|---|
| A+ | 4.00 | | C+ | 2.50 |
| A | 3.75 | | C | 2.25 |
| A- | 3.50 | | D | 2.00 |
| B+ | 3.25 | | F | 0.00 |
| B | 3.00 | | AB | 0.00 (absent) |
| B- | 2.75 | | | |

---

## What it shows

**01 The class at a glance.** Headcount, mean, median, mode, highest, lowest, range. Plus the status breakdown (Passed, Promoted, Not Promoted and so on) and whatever the sheet header claimed.

**02 Spread and shape.** Standard deviation both ways, variance, mean absolute deviation, median absolute deviation, coefficient of variation, IQR, skew and excess kurtosis. A 0.10 wide histogram sits underneath with the mean and median marked and the outer bands shaded.

Three measures of spread rather than one, because they disagree usefully. One absent student sitting at 0.00 drags the standard deviation hard while the median absolute deviation barely twitches, so a wide gap between them tells you the tail is doing the work.

**03 Top and bottom.** Highest and lowest CGPA by name, the gap between them, counts at 3.75 and above and below 2.50, then the top ten and bottom ten.

**04 Three bands.** Low, mid and high, split by headcount so each holds roughly a third. Cut points and per band mean and SD are shown. Splitting by equal CGPA width instead would leave the bottom band nearly empty on most sheets, which is why it is done this way.

**05 Course by course.** For each course: a colour ribbon of the grade spread, mean grade point, SD, fail and absent counts, A+ rate, and the correlation between that course's grade points and overall CGPA. Sorted toughest first. An exact A+ through AB count grid follows.

That correlation column is the interesting one. A high value means the course sorted the class the same way everything else did. A low one means it graded on something of its own.

**06 Odd IDs against even IDs.** Group sizes, means, medians and SDs, plus a Welch t-test and Cohen's d. You can switch between student ID, registration number and serial.

There is no reason these halves should differ, which makes this a sanity check on everything above it. Read it carefully though: run the same split on twenty sheets and about one will cross the 5% line on luck alone, so a single significant result here is not a finding.

**07 Other cuts.** By sex (with the same test), by session, and by batch where more than one is present. Repeaters carry an older session, so a weak older-session group usually means retakes rather than a weak intake year.

**08 Semester to semester.** Mean GPA plotted across semesters with n, SD, min and max per semester, then who climbed the most and who slipped the most. Only students carrying more than one semester are included. Single semester sheets show a note here instead.

**09 Who needs watching.** Anyone below 2.50, short on credits, or holding an F or AB. Total credit shortfall for the class, retake load, and a per course count of sittings to redo.

**10 Every student.** Sortable, searchable table with rank, percentile, band, credits earned against enrolled, and status. Exports to CSV.

Click any row to open that student's full grade sheet underneath it: every course with its letter grade, credit weight and grade point, the course titles where the sheet prints them, and a strip of GPA per semester with credits earned against enrolled. A weighted average across just the courses on this sheet is shown too, which is not the same number as the CGPA and is worth comparing against it.

Every semester on the sheet gets its own sortable column, so you can rank the class by Sem 3 alone and see who peaked early against who came good late. Students who never sat a given semester show a dot and sink to the bottom whichever way you sort, rather than being treated as a zero. On a single semester sheet the columns are skipped, since they would only repeat the CGPA.

There is also a **Passed and promoted only** filter, which drops anyone marked Not Promoted, Withdrawn, Absent or Incomplete. Handy when you want the picture for students who actually cleared the semester, since a relegated student sitting at 0.00 distorts a ranking badly. The label tells you how many rows it hides. The CSV export respects the filter.

---

## Controls

| Control | What it does |
|---|---|
| **Leave out 0.00 CGPA** | Drops absent and withdrawn students from the statistics. On by default, since a handful of zeros wrecks the mean and SD. Untick to see the raw picture. |
| **Hide names** | Replaces names with initials and the last four digits of the ID. Useful before screenshotting anything. |
| **Odd/even read from** | Which identifier the parity split uses. |
| **Passed and promoted only** | Section 10 filter. Drops Not Promoted, Withdrawn, Absent and Incomplete rows. |
| **Semester GPA columns** | Shows or hides one sortable column per semester in section 10. |
| **Download table as CSV** | Section 10 as it currently stands, respecting both the hide-names and the passed-only settings. |
| **Dark / Light** | Theme toggle, top right. Follows your system setting on first load and remembers your choice after that. |

---

## Limitations

Worth knowing before you quote any of it:

- Everything is descriptive. The t-tests tell you whether a gap is bigger than noise, not why.
- CGPA is read from the sheet, not recomputed from the printed grades. If a tabulation error exists upstream it comes through untouched.
- The class distinction and probation thresholds are not encoded, since I did not want to invent BUP's actual cutoffs. The 3.75 and 2.50 figures in section 03 are conventional markers, nothing official.
- Multi-file mode analyses one sheet at a time. There is no cross-sheet comparison yet.
- Tested against seven real sheets covering ICE, ENG and BDS, in a simulated DOM rather than every browser. Chrome, Firefox and Safari should all be fine, but the layout deserves an eyeball on whatever you actually use.

---

## Vendoring the dependencies

To make the file work with no network at all, download these two and point the tags at local copies:

```
https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
```

Then either drop the IBM Plex font files alongside it, or delete the `<link>` tags and let the CSS fall back to the system stack. The `font-family` declarations already name fallbacks, so nothing breaks if the fonts never arrive. It just looks plainer.

---

## Poking at the code

Everything lives in one file. The script splits into two halves:

```
// ==== CORE (pure) ====     parsing and statistics, no DOM
// ==== END CORE ====        everything below touches the page
```

The core half has no browser dependencies, so you can pull it into Node and test against JSON dumps of the sheets without a browser:

```js
const core = html.split('// ==== CORE (pure) ====')[1]
                 .split('// ==== END CORE ====')[0];
```

Key functions:

| Function | Does |
|---|---|
| `parseSheet(rows, sheetName)` | Rows of the first worksheet in, structured student records out |
| `courseStats(list)` | Per course counts, mean GP, fail rate, correlation with CGPA |
| `terciles(list)` | Headcount based low/mid/high split |
| `welch(a, b)` | Welch t-test with p-value via the incomplete beta function |
| `rankAll(list)` | Dense rank and percentile, mutates in place |

Colours all come from CSS custom properties, including the ones inside the generated SVG charts. Adding a theme means adding one block of variables under a new `[data-theme="..."]` selector, nothing more.

---

## Adding to it

Things the same data would support that are not built yet:

- Grade inflation across semesters, comparing mean GP for the same course code across different sheets
- Credit weighted GPA recomputation, to check published figures against printed grades
- Rank movement between two sheets of the same batch
- A grade correlation matrix between course pairs, to see whether the maths papers cluster separately from the labs
- Predicted final CGPA from partial semesters, using the cohort's own drift rather than a flat average
