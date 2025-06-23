import React, { useRef } from 'react';
import { Button } from './button';

interface FileUploadListProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
    disabled?: boolean;
    accept?: string;
    label?: string;
    emptyMessage?: string;
}

const FileUploadList: React.FC<FileUploadListProps> = ({
    files,
    onFilesChange,
    disabled = false,
    accept = ".txt,.csv,.json",
    label = "Upload Files",
    emptyMessage = "No files uploaded. Click 'Upload Files' to add files."
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            onFilesChange([...files, ...newFiles]);
        }
    };

    const handleRemoveFile = (index: number) => {
        onFilesChange(files.filter((_, i) => i !== index));
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-center">
                <Button
                    onClick={handleUploadClick}
                    variant="upload"
                    size="lg" 
                    className="px-8 py-4 min-w-[200px] font-semibold"
                    disabled={disabled}
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {label}
                </Button>
            </div>
            
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
                accept={accept}
            />

            <div className="space-y-3 min-h-[120px] border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50/30">
                {files.length > 0 ? (
                    <>
                        <div className="text-sm font-semibold text-gray-700 mb-2">
                            Uploaded Files ({files.length})
                        </div>
                        {files.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 truncate max-w-[200px] block">
                                            {file.name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleRemoveFile(index)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span className="ml-1">Remove</span>
                                </Button>
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="text-center py-8">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m-3 3V9" />
                        </svg>
                        <p className="text-sm text-gray-500 font-medium">
                            {emptyMessage}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploadList; 