'use client';

// ============================================================================
// TEMPLATE UPLOAD
// Drag-and-drop file upload with metadata
// ============================================================================

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface TemplateUploadProps {
  onSuccess: (document: any) => void;
  onCancel: () => void;
}

export default function TemplateUpload({ onSuccess, onCancel }: TemplateUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [appealTypes, setAppealTypes] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Available appeal types (hardcoded for now, could be loaded from API)
  const availableAppealTypes = [
    'seller-suspension',
    'listing-issue',
    'kdp-acx',
    'fba',
    'relay',
    'other',
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['.docx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(fileExtension)) {
      toast.error('Only .docx and .txt files are supported');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(file);
  };

  const toggleAppealType = (type: string) => {
    setAppealTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('appealTypes', JSON.stringify(appealTypes));
      formData.append('description', description);
      formData.append('tags', JSON.stringify(tags));

      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Template uploaded successfully');
        onSuccess(data.document);
      } else {
        toast.error(data.error || 'Failed to upload template');
      }
    } catch (error: any) {
      console.error('Error uploading template:', error);
      toast.error('Failed to upload template');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Upload New Template</h2>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document File <span className="text-red-500">*</span>
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : file
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {file ? (
            <div>
              <svg
                className="w-12 h-12 text-green-500 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-700"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div>
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your file here, or click to browse
              </p>
              <input
                type="file"
                accept=".docx,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Choose File
              </label>
              <p className="text-xs text-gray-500 mt-2">DOCX or TXT files only (max 10MB)</p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Brief description of this template..."
        />
      </div>

      {/* Appeal Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Applicable Appeal Types
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availableAppealTypes.map((type) => (
            <label
              key={type}
              className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={appealTypes.includes(type)}
                onChange={() => toggleAppealType(type)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{type}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Leave empty to make template available for all appeal types
        </p>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add tags..."
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isUploading}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!file || isUploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload Template'}
        </button>
      </div>
    </form>
  );
}
