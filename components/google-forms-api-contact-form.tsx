'use client';

import { useState } from 'react';

interface FormData {
  name: string;
  organization: string;
  contact: string;
  inquiry: string;
}

interface FormErrors {
  name?: string;
  organization?: string;
  contact?: string;
  inquiry?: string;
  general?: string;
}

interface FormField {
  id: keyof FormData;
  label: string;
  type: 'text' | 'email' | 'textarea';
  placeholder: string;
  required: boolean;
  rows?: number;
}

const formFields: FormField[] = [
  {
    id: 'name',
    label: 'お名前',
    type: 'text',
    placeholder: 'お名前を入力',
    required: true,
  },
  {
    id: 'organization',
    label: '会社名・組織名',
    type: 'text',
    placeholder: '会社名・組織名を入力',
    required: false,
  },
  {
    id: 'contact',
    label: 'ご連絡先',
    type: 'email',
    placeholder: 'メールアドレスを入力',
    required: true,
  },
  {
    id: 'inquiry',
    label: 'お問い合わせ内容',
    type: 'textarea',
    placeholder: 'お問い合わせ内容を入力してください...',
    required: true,
    rows: 6,
  },
];

export default function GoogleFormsAPIContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    organization: '',
    contact: '',
    inquiry: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // お名前のバリデーション
    if (!formData.name.trim()) {
      newErrors.name = 'お名前を入力してください';
    }

    // ご連絡先のバリデーション
    if (!formData.contact.trim()) {
      newErrors.contact = 'ご連絡先を入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact)) {
      newErrors.contact = '有効なメールアドレスを入力してください';
    }

    // お問い合わせ内容のバリデーション
    if (!formData.inquiry.trim()) {
      newErrors.inquiry = 'お問い合わせ内容を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrors({});

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', organization: '', contact: '', inquiry: '' });
      } else {
        setSubmitStatus('error');
        setErrors({ general: result.error || '送信に失敗しました' });
      }
    } catch {
      setSubmitStatus('error');
      setErrors({ general: 'ネットワークエラーが発生しました' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const baseClassName = `w-full px-4 py-3 bg-neutral-900/10 border-[1px] rounded-md inner-shadow text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent backdrop-blur-xs transition-all ${
      errors[field.id] ? 'border-red-500' : 'border-neutral-700'
    }`;

    return (
      <div key={field.id}>
        <label
          htmlFor={field.id}
          className="flex gap-2 items-center text-sm font-medium text-neutral-300 mb-2"
        >
          {field.label}
          <span
            className={
              field.required
                ? 'text-red-200 text-xs'
                : 'text-neutral-400 text-xs'
            }
          >
            {field.required ? '必須' : '任意'}
          </span>
        </label>
        {field.type === 'textarea' ? (
          <textarea
            id={field.id}
            name={field.id}
            value={formData[field.id]}
            onChange={handleChange}
            rows={field.rows || 4}
            className={`${baseClassName} resize-none`}
            placeholder={field.placeholder}
          />
        ) : (
          <input
            type={field.type}
            id={field.id}
            name={field.id}
            value={formData[field.id]}
            onChange={handleChange}
            className={baseClassName}
            placeholder={field.placeholder}
          />
        )}
        {errors[field.id] && (
          <p className="mt-1 text-sm text-red-400">{errors[field.id]}</p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {formFields.map(renderField)}

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-3 bg-neutral-800/40 border-[1px] border-neutral-700 shadow-md hover:bg-neutral-800/20 hover:text-neutral-500 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          {isSubmitting ? '送信中...' : '送信する'}
        </button>

        {errors.general && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-center">{errors.general}</p>
          </div>
        )}

        {submitStatus === 'success' && (
          <div className="p-4">
            <p className="text-green-300 text-center">
              お問い合わせを送信しました。
              <br />
              お問い合わせ内容を確認の上、ご連絡いたします。
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
