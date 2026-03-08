import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  MapPin, 
  Upload, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { CATEGORIES, SEVERITIES } from '../../utils/constants'

// Map Gemini API category strings to backend category values
const GEMINI_CATEGORY_MAP = {
  'Road Damage': 'ROAD_DAMAGE',
  'Drainage Problem': 'DRAINAGE',
  'Water Leakage': 'WATER_SUPPLY',
  'Environmental Issues': 'ENVIRONMENTAL',
  'Electricity Issues': 'ELECTRICITY',
  'Public Land Property': 'PUBLIC_PROPERTY',
  'Street Light Issue': 'STREET_LIGHTS',
  'Others': 'OTHER'
}

// Map Gemini severity to backend severity
const GEMINI_SEVERITY_MAP = {
  'Critical': 'CRITICAL',
  'High': 'HIGH',
  'Medium': 'MEDIUM',
  'Low': 'LOW'
}

const ANALYZER_API = import.meta.env.VITE_ANALYZER_API_URL || '/analyzer'

export default function SubmitIssue() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    severity: 'MEDIUM',
    location: '',
    landmark: ''
  })
  const [images, setImages] = useState([])
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setErrors({ ...errors, [e.target.name]: '' })
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const analyzeImagesWithGemini = async (files) => {
    if (!files.length) return
    setAnalyzing(true)
    try {
      const formDataUpload = new FormData()
      files.forEach((file) => formDataUpload.append('files', file))

      const res = await fetch(`${ANALYZER_API}/analyze-images`, {
        method: 'POST',
        body: formDataUpload
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      const results = data.results || []
      if (results.length > 0) {
        const first = results[0]
        const category = GEMINI_CATEGORY_MAP[first.category] || first.category || ''
        const severity = GEMINI_SEVERITY_MAP[first.severity_level] || first.severity_level || 'MEDIUM'
        setFormData((prev) => ({
          ...prev,
          category: category || prev.category,
          description: first.description || prev.description,
          severity: severity || prev.severity
        }))
        toast.success('Photo analyzed — category, description and severity filled automatically.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Could not analyze photo. Please fill the form manually.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB`)
        return false
      }
      return true
    })

    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    const allImages = [...images, ...newImages]
    setImages(allImages)

    if (validFiles.length > 0) {
      analyzeImagesWithGemini(validFiles)
    }
  }

  const removeImage = (index) => {
    const newImages = [...images]
    URL.revokeObjectURL(newImages[index].preview)
    newImages.splice(index, 1)
    setImages(newImages)
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.category) newErrors.category = 'Please select a category'
    if (!formData.description || formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
    }
    if (!formData.location) newErrors.location = 'Location is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)

    try {
      // Create form data for multipart upload
      const submitData = new FormData()
      submitData.append('category', formData.category)
      submitData.append('description', formData.description)
      submitData.append('severity', formData.severity)
      submitData.append('location', formData.location)
      submitData.append('landmark', formData.landmark)

      // Append images
      images.forEach(img => {
        submitData.append('images', img.file)
      })

      const response = await api.post('/tickets', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('Issue reported successfully!')
      navigate(`/citizen/tickets/${response.data.data.ticket.id}`)
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit issue'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-surface-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-display font-bold text-white">
          Report New Issue
        </h1>
        <p className="text-surface-400 mt-1">
          Provide details about the issue you want to report
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="card p-6 lg:p-8 space-y-6"
      >
        {/* Image Upload - First: upload photo to auto-fill category, description, severity */}
        <div>
          <label className="label">
            Upload photo of the issue (we&apos;ll auto-fill category, description & severity)
          </label>
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-surface-700 rounded-xl hover:border-primary-500/50 cursor-pointer transition-colors bg-surface-800/30">
              {analyzing ? (
                <>
                  <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-3" />
                  <p className="text-sm text-surface-400">Analyzing with AI...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-surface-500 mb-3" />
                  <p className="text-sm text-surface-400 text-center">
                    <span className="text-primary-400 font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-surface-500 mt-1">
                    PNG, JPG, GIF up to 10MB (max 5 images)
                  </p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                disabled={analyzing}
              />
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category - Auto-filled from photo analysis */}
        <div>
          <label className="label">Issue Category *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, category: cat.value })
                  setErrors({ ...errors, category: '' })
                }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  formData.category === cat.value
                    ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                    : 'bg-surface-800/50 border-surface-700 text-surface-300 hover:border-surface-600'
                }`}
              >
                <span className="text-2xl mb-2 block">{cat.icon}</span>
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
          {errors.category && (
            <p className="text-rose-400 text-xs mt-2">{errors.category}</p>
          )}
        </div>

        {/* Description - Auto-filled from photo analysis */}
        <div>
          <label htmlFor="description" className="label">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`input resize-none ${errors.description ? 'input-error' : ''}`}
            placeholder="Describe the issue in detail (minimum 20 characters)..."
          />
          <div className="flex justify-between mt-1">
            {errors.description && (
              <p className="text-rose-400 text-xs">{errors.description}</p>
            )}
            <p className="text-xs text-surface-500 ml-auto">
              {formData.description.length}/2000
            </p>
          </div>
        </div>

        {/* Severity - Auto-filled from photo analysis */}
        <div>
          <label className="label">Severity Level *</label>
          <div className="flex gap-3">
            {SEVERITIES.map((sev) => (
              <button
                key={sev.value}
                type="button"
                onClick={() => setFormData({ ...formData, severity: sev.value })}
                className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-all ${
                  formData.severity === sev.value
                    ? `bg-${sev.color}-500/20 border-${sev.color}-500 text-${sev.color}-400`
                    : 'bg-surface-800/50 border-surface-700 text-surface-400 hover:border-surface-600'
                }`}
              >
                {sev.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="label">
            Location *
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-surface-500" />
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`input pl-12 ${errors.location ? 'input-error' : ''}`}
              placeholder="Street name, area, or address"
            />
          </div>
          {errors.location && (
            <p className="text-rose-400 text-xs mt-1">{errors.location}</p>
          )}
        </div>

        {/* Landmark */}
        <div>
          <label htmlFor="landmark" className="label">
            Nearby Landmark
          </label>
          <input
            type="text"
            id="landmark"
            name="landmark"
            value={formData.landmark}
            onChange={handleChange}
            className="input"
            placeholder="Any nearby landmark for easy identification"
          />
        </div>

        {/* Submit button */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Submit Issue
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  )
}
