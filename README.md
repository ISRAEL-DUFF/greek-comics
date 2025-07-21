# Ἑλληνικὰ Κόμιξ (Hellenika Komiks) - Ancient Greek Illustrated Story Generator

Welcome to **Ἑλληνικὰ Κόμιξ**, an AI-powered application designed to help learners of all levels engage with Ancient Greek in a fun, visual, and interactive way. This tool leverages generative AI to create short, illustrated stories tailored to your specific learning needs.

Built with Next.js, Genkit, and ShadCN UI, this application serves as a powerful companion for students, educators, and enthusiasts of the Ancient Greek language.

## Core Features

### 1. Customizable Story Generation
You have complete control over the content of the stories. The generation form allows you to specify:
- **Learner Level**: Choose from `Beginner`, `Intermediate`, or `Advanced` to match your proficiency.
- **Story Topic**: Provide any topic you can imagine, from "A cat is in the house" to "Socrates discusses philosophy in the agora."
- **Grammar Scope**: Define the specific grammatical structures you want to focus on (e.g., "Present tense verbs, singular nouns, basic prepositions").
- **Story Length**: Set a minimum and maximum number of sentences to control the length of the generated story.

### 2. Rich, Interactive Reading Experience
Once a story is generated, it's displayed in an interactive comic-book-style format.
- **AI-Generated Illustrations**: Each sentence is paired with a unique, full-color illustration that visually represents the action, aiding comprehension.
- **Show/Hide Illustrations**: A toggle allows you to hide the images, letting you focus solely on the Greek text or prepare a text-only version for printing.

### 3. Deep Word-Level Analysis
Clicking on any word in the Greek text opens a detailed popover, turning every story into a rich learning module. This "digital flashcard" provides:
- **Gloss**: The word's dictionary form (lemma), part of speech, and a concise English definition.
- **Morphology**: A detailed morphological breakdown (e.g., "Noun, Nom, Sg, Masc" or "Verb, Pres, Act, Ind, 3rd, Sg").
- **Syntax Note**: A specific note explaining the word's grammatical role within that particular sentence (e.g., "subject of verb λύει," "dative of possession").

### 4. Story Management & Portability
- **Save Stories**: If Supabase environment variables are configured, you can save your favorite stories to the cloud to revisit them later.
- **Export to JSON**: Export any generated story, complete with its text, illustrations, and all gloss data, to a local JSON file. This allows you to save your work offline or share it with others.
- **Import from JSON**: You can import a previously exported JSON file to load a story back into the application.
- **Download as PDF**: The browser's print functionality is configured to generate a clean, printable PDF version of the story, including illustrations and text.

### 5. Backward Compatibility & Data Updates
- **Handles Old Story Formats**: The application can load stories created with previous versions, ensuring that even if the data structure has changed, your old content remains accessible.
- **Update Glosses**: For stories saved before the morphology feature was added, a button appears allowing you to regenerate the glosses to include the new morphological data.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Generative AI**: Google AI via Genkit
- **UI**: React, TypeScript, ShadCN UI, Tailwind CSS
- **Database (Optional)**: Supabase
- **Fonts**: Gentium Book Plus for readability of Ancient Greek text.

This project was built inside **Firebase Studio**.
