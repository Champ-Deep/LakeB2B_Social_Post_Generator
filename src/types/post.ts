export interface PostFormData {
  message: string
  headline: string
}

export interface GeneratedPost {
  id: string
  imageUrl: string
  prompt: string
  createdAt: Date
  formData: PostFormData
}