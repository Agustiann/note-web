export interface AuthUser {
    id: string
    name: string
    email: string
    photo: string | null
    created_at: string
}

export interface Folder {
    id: string
    name: string
    notes_count: number | null
    created_at: string
    updated_at: string
}

export interface NoteImage {
    id: string
    file_name: string
    url: string
    content?: string
    mime_type: string
    created_at: string
}

export interface NoteChecklistItem {
    id: string
    note_id: string
    content: string
    is_completed: boolean
    position: number
    created_at: string
    updated_at: string
}

export interface NoteFolder {
    id: string
    name: string
}

export interface Note {
    id: string
    title: string
    content: string | null
    folder_id: string | null
    folder: NoteFolder | null
    images: NoteImage[]
    checklists: NoteChecklistItem[]
    created_at: string
    updated_at: string
}

export interface ApiResponse<T> {
    message: string
    data: T
}
export interface NotesListResponse<T> {
    message: string
    data: {
        total_all_notes: number
        notes: T
    }
}