# Ἑλληνικὰ Κόμιξ (Hellenika Komiks) - Ancient Greek Illustrated Story Generator

Welcome to **Ἑλληνικὰ Κόμιξ**, an AI-powered application designed to help learners of all levels engage with Ancient Greek in a fun, visual, and interactive way. This tool leverages generative AI to create short, illustrated stories and full books tailored to your specific learning needs.

Built with Next.js, Genkit, and ShadCN UI, this application serves as a powerful companion for students, educators, and enthusiasts of the Ancient Greek language.

## Core Features

### 1. Story Generator
Create sentence-by-sentence illustrated stories.
- **Customizable Generation**: Control the story's `Learner Level`, `Topic`, `Grammar Scope`, and `Length`.
- **AI-Generated Illustrations**: Each sentence is paired with a unique, full-color illustration.
- **Interactive Reading**:
    - **Word Gloss**: Click any Greek word to see its dictionary form, part of speech, definition, and detailed morphology in a popover.
    - **Sentence Analysis**: A dedicated button for each sentence opens a detailed modal with a full translation and a word-by-word grammatical breakdown.
- **Display Controls**: Toggle visibility for illustrations, English translations, and the analysis button to customize your reading experience.
- **Story Management**: Save stories to a database (if configured), export them to JSON, import from a JSON file, or download a clean PDF for printing.

### 2. Book Generator
Generate complete, multi-page illustrated books in Ancient Greek.
- **Rich Content**: Specify the `Topic`, `Level`, `Grammar Scope`, and `Number of Pages` to create a cohesive book with a title and a fictional Greek author.
- **Paragraphs & Illustrations**: Each page contains multiple paragraphs and two main full-color illustration placeholders, which can be generated on-demand.
- **Illustrated Footnotes**: Each page includes a "Λεξικὸν" (Glossary) section with 3-5 key vocabulary words, defined in simple Greek, and accompanied by small, icon-style illustrations that can also be generated on-demand.
- **On-Demand Image Generation**: To speed up book creation and give you creative control, illustrations are not generated automatically. Click on a placeholder to open a modal where you can:
    - View the AI-generated prompt.
    - Generate the image with a single click.
    - Upload your own image from your computer.
- **Portability**: Export your finished book, including all generated or uploaded images, to a JSON file for offline storage or sharing. You can also import a book from a JSON file.

### 3. Word Expansion Tool
A powerful lexicography tool for deep analysis of any Ancient Greek word.
- **Comprehensive Analysis**: Get a detailed breakdown of a word based on its part of speech, including:
    - **Verbs**: Gloss, principal parts, full conjugation paradigms, and etymology.
    - **Nouns/Adjectives**: Gloss, full declension paradigms, and etymology.
    - **Participles**: Identification of the source verb, its principal parts, full declension of the participle, and usage notes.
    - **Other Words**: Detailed description, etymology, and usage examples.
- **Multi-Word Input**: Expand multiple words at once by separating them with commas.
- **History & Search**:
    - Previously expanded words are saved and listed in a categorized history for quick access.
    - An intelligent search allows you to find words within the Markdown content of all your saved expansions.
- **Markdown Support**: The output is in well-formatted Markdown, with paradigms presented in clear tables. You can also edit the generated Markdown and save your changes.

### 4. Direct Story Integration
While reading a story in the Story Generator, you can click on any word and select "Expand Word". This will open the Word Expansion Tool in a new tab and automatically analyze that specific word, creating a seamless workflow between reading and deep linguistic study.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Generative AI**: Google AI via Genkit
- **UI**: React, TypeScript, ShadCN UI, Tailwind CSS
- **Database (Optional)**: Supabase
- **Fonts**: Gentium Book Plus for readability of Ancient Greek text.

This project was built inside **Firebase Studio**.
