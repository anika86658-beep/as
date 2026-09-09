import React, { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Table,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  Check,
  Eye,
  Layers,
  HelpCircle,
  Video,
  FileSpreadsheet,
  Globe,
  Upload,
  FolderUp,
  X
} from 'lucide-react';
import { Product, CategoryItem } from '../types';
import { api } from '../services/api';
import { INITIAL_CATEGORIES } from '../data/initialData';
import { compressImage } from '../utils/imageCompressor';
import { RichDescriptionRenderer } from './RichDescriptionRenderer';

interface NewProductFormProps {
  categories?: CategoryItem[];
  onSaveProduct: (productData: Partial<Product> & { [key: string]: any }) => void;
  onCancel: () => void;
}

export const NewProductForm: React.FC<NewProductFormProps> = ({ categories: propCategories, onSaveProduct, onCancel }) => {
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(propCategories || INITIAL_CATEGORIES);

  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setCategoriesList(propCategories);
    } else {
      api.getCategories().then(cats => {
        if (cats && cats.length > 0) setCategoriesList(cats);
      });
    }
  }, [propCategories]);

  // Main Basic Details
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('Arishten Organic');
  const [price, setPrice] = useState<string>('');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [weightInput, setWeightInput] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [insideDhakaFee, setInsideDhakaFee] = useState<string>('60');
  const [outsideDhakaFee, setOutsideDhakaFee] = useState<string>('120');
  const [mainImageUrl, setMainImageUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [descriptionMode, setDescriptionMode] = useState<'visual' | 'preview' | 'html'>('visual');
  const [tags, setTags] = useState<string>('');

  // Stock & Purchase Rules
  const [inStock, setInStock] = useState<boolean>(true);
  const [stockCount, setStockCount] = useState<string>('120');
  const [minPurchaseQty, setMinPurchaseQty] = useState<string>('1');

  // Feature Toggles
  const [isBestSeller, setIsBestSeller] = useState<boolean>(true);
  const [isNewArrival, setIsNewArrival] = useState<boolean>(true);
  const [isPremiumCollection, setIsPremiumCollection] = useState<boolean>(false);

  // Accordion Expand States
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({
    seo: false,
    gallery: false,
    youtube: false,
    variants: false,
    specifications: false,
    qna: false
  });

  // Accordion Details Data
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryInput, setNewGalleryInput] = useState('');

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  const handleMainFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const currentAll = [mainImageUrl, ...galleryImages].filter(Boolean);
      const remainingSlots = 5 - currentAll.length;
      if (remainingSlots <= 0) {
        alert('সর্বোচ্চ ৫টি ছবি আপলোড করা যাবে। (Maximum 5 images allowed)');
        return;
      }
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      const compressedResults: string[] = [];

      for (const file of filesToProcess) {
        try {
          const compressed = await compressImage(file);
          compressedResults.push(compressed);
        } catch (err) {
          console.warn('Image compression fallback:', err);
        }
      }

      if (compressedResults.length > 0) {
        const combined = [...currentAll, ...compressedResults].slice(0, 5);
        if (combined.length > 0) {
          setMainImageUrl(combined[0]);
          setGalleryImages(combined.slice(1));
        }
      }

      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const remainingSlots = 5 - galleryImages.length;
      if (remainingSlots <= 0) {
        alert('সর্বোচ্চ ৫টি ছবি আপলোড করা যাবে। (Maximum 5 images allowed)');
        return;
      }
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      const compressedResults: string[] = [];

      for (const file of filesToProcess) {
        try {
          const compressed = await compressImage(file);
          compressedResults.push(compressed);
        } catch (err) {
          console.warn('Gallery image compression fallback:', err);
        }
      }

      if (compressedResults.length > 0) {
        setGalleryImages(prev => {
          const updated = [...prev, ...compressedResults].slice(0, 5);
          return updated;
        });
      }

      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [variants, setVariants] = useState<Array<{ id: string; name: string; weight: string; price: number; stock: number }>>([]);
  const [varName, setVarName] = useState('');
  const [varWeight, setVarWeight] = useState('500g');
  const [varPrice, setVarPrice] = useState('');
  const [varStock, setVarStock] = useState('50');

  const [specifications, setSpecifications] = useState<Array<{ id: string; key: string; value: string }>>([]);
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  const [qnaList, setQnaList] = useState<Array<{ id: string; question: string; answer: string }>>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const toggleAccordion = (key: string) => {
    setExpandedAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Image Presets for quick convenience
  const quickImagePresets = [
    { label: 'Sundarban Honey', url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80' },
    { label: 'Mustard Honey', url: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&auto=format&fit=crop&q=80' },
    { label: 'Kalijira Honey', url: 'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=800&auto=format&fit=crop&q=80' },
    { label: 'Mustard Oil', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80' },
    { label: 'Deshi Ghee', url: 'https://images.unsplash.com/photo-1589927986086-3d10fb5555ca?w=800&auto=format&fit=crop&q=80' }
  ];

  const handleAddGalleryImage = () => {
    if (newGalleryInput.trim()) {
      setGalleryImages(prev => [...prev, newGalleryInput.trim()]);
      setNewGalleryInput('');
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    if (varName.trim() && varPrice) {
      setVariants(prev => [
        ...prev,
        {
          id: String(Date.now()),
          name: varName,
          weight: varWeight,
          price: Number(varPrice) || 0,
          stock: Number(varStock) || 0
        }
      ]);
      setVarName('');
      setVarPrice('');
    }
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const handleAddSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setSpecifications(prev => [
        ...prev,
        { id: String(Date.now()), key: newSpecKey.trim(), value: newSpecValue.trim() }
      ]);
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const handleRemoveSpecification = (id: string) => {
    setSpecifications(prev => prev.filter(s => s.id !== id));
  };

  const handleAddQna = () => {
    if (newQuestion.trim() && newAnswer.trim()) {
      setQnaList(prev => [
        ...prev,
        { id: String(Date.now()), question: newQuestion.trim(), answer: newAnswer.trim() }
      ]);
      setNewQuestion('');
      setNewAnswer('');
    }
  };

  const handleRemoveQna = (id: string) => {
    setQnaList(prev => prev.filter(q => q.id !== id));
  };

  // Rich Text Formatting helper
  const handleFormatText = (command: string, value: string = '') => {
    const textarea = document.getElementById('product-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);
    let replacement = selectedText;

    switch (command) {
      case 'bold':
        replacement = `**${selectedText || 'Bold Text'}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || 'Italic Text'}*`;
        break;
      case 'underline':
        replacement = `<u>${selectedText || 'Underlined Text'}</u>`;
        break;
      case 'h1':
        replacement = `\n# ${selectedText || 'Heading 1'}\n`;
        break;
      case 'h2':
        replacement = `\n## ${selectedText || 'Heading 2'}\n`;
        break;
      case 'h3':
        replacement = `\n### ${selectedText || 'Heading 3'}\n`;
        break;
      case 'list':
        replacement = `\n- ${selectedText || 'List item 1'}\n- List item 2\n`;
        break;
      case 'numbered-list':
        replacement = `\n1. ${selectedText || 'Step 1'}\n2. Step 2\n`;
        break;
      case 'quote':
        replacement = `\n> ${selectedText || 'Quote text'}\n`;
        break;
      case 'code':
        replacement = `\`${selectedText || 'code'}\``;
        break;
      case 'hr':
        replacement = `\n---\n`;
        break;
      case 'link':
        replacement = `[${selectedText || 'Link Title'}](https://arishten.com)`;
        break;
      default:
        break;
    }

    const newDesc = description.substring(0, start) + replacement + description.substring(end);
    setDescription(newDesc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setFormError('দয়া করে পণ্যের নাম (Product Name) লিখুন');
      return;
    }
    if (!price || Number(price) <= 0) {
      setFormError('দয়া করে সঠিক মূল্য (Price) দিন');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const selectedCatObj = categoriesList.find(c => c.key === category || c.id === category);
    const categoryKey = category ? category : 'other';
    const categoryLabel = selectedCatObj ? (selectedCatObj.bnName || selectedCatObj.name) : (category ? category.trim() : '');

    const defaultImg =
      mainImageUrl ||
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80';

    const newProductData: Partial<Product> & { [key: string]: any } = {
      name: productName,
      bnName: productName,
      brand: brand || 'Arishten Organic',
      category: categoryKey as any,
      categoryLabel,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      discountBadge: originalPrice && Number(originalPrice) > Number(price) ? `${Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)}% OFF` : undefined,
      weight: weightInput.trim(),
      image: defaultImg,
      images: [defaultImg, ...galleryImages].filter(Boolean),
      rating: 5.0,
      reviewsCount: 1,
      inStock,
      stockCount: stockCount ? Number(stockCount) : 100,
      description,
      features: specifications.map(s => `${s.key}: ${s.value}`),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      isBestSeller,
      isNewArrival,
      isPremiumCollection,
      minPurchaseQty: Number(minPurchaseQty) || 1,
      insideDhakaFee: insideDhakaFee ? Number(insideDhakaFee) : 60,
      outsideDhakaFee: outsideDhakaFee ? Number(outsideDhakaFee) : 120,
      seo: { title: seoTitle, description: seoDescription, keywords: seoKeywords, canonical: canonicalUrl },
      galleryImages,
      youtubeUrl,
      variants,
      specifications,
      qnaList
    };

    setIsSubmitting(false);
    onSaveProduct(newProductData);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs overflow-hidden max-w-5xl mx-auto font-sans">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {/* Title matching image: "New Product" */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">New Product</h1>
          <span className="text-xs text-gray-400 font-medium">Add to Organic Catalog</span>
        </div>

        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <span className="font-bold">Error:</span> {formError}
          </div>
        )}

        {/* Row 1: Product Name * | Brand */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder="Product Name"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Brand</label>
            <input
              type="text"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              placeholder="Arishten"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-gray-900"
            />
          </div>
        </div>

        {/* Row 2: Price (৳) * | Original Price (৳) | Weight / Size | Category */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Price (৳) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="e.g. 1200"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Original Price (৳)</label>
            <input
              type="number"
              value={originalPrice}
              onChange={e => setOriginalPrice(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Weight / Size</label>
            <input
              type="text"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              placeholder="e.g. 1kg, 500g (Optional)"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-gray-800 pr-9 cursor-pointer"
              >
                <option value="">Select Category</option>
                {categoriesList.map(cat => (
                  <option key={cat.id || cat.key} value={cat.key}>
                    {cat.name} {cat.bnName ? `(${cat.bnName})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Delivery Fees Setup Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/60">
          <div>
            <label className="block text-xs font-semibold text-emerald-900 mb-1.5 flex items-center justify-between">
              <span>ঢাকার ভেতরে ডেলিভারি ফি (Inside Dhaka Fee ৳)</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">ডিফল্ট: ৬০ টাকা</span>
            </label>
            <input
              type="number"
              value={insideDhakaFee}
              onChange={e => setInsideDhakaFee(e.target.value)}
              placeholder="60"
              className="w-full px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all text-gray-900 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-900 mb-1.5 flex items-center justify-between">
              <span>ঢাকার বাইরে ডেলিভারি ফি (Outside Dhaka Fee ৳)</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">ডিফল্ট: ১২০ টাকা</span>
            </label>
            <input
              type="number"
              value={outsideDhakaFee}
              onChange={e => setOutsideDhakaFee(e.target.value)}
              placeholder="120"
              className="w-full px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all text-gray-900 font-bold"
            />
          </div>
        </div>

        {/* Row 3: Main Image URL & Multiple Local Device Upload (Up to 5 images) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              পণ্যের ছবিসমূহ (Product Images — সর্বোচ্চ ৫টি)
            </label>
            <button
              type="button"
              onClick={() => mainFileInputRef.current?.click()}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>একসাথে ৫টি পর্যন্ত ছবি আপলোড</span>
            </button>
          </div>

          {/* Hidden Multiple File Input */}
          <input
            type="file"
            multiple
            ref={mainFileInputRef}
            onChange={handleMainFileUpload}
            accept="image/*"
            className="hidden"
          />

          <div className="relative flex items-center mb-2">
            <input
              type="text"
              value={mainImageUrl}
              onChange={e => setMainImageUrl(e.target.value)}
              placeholder="https://... মূল ছবির URL অথবা ডিভাইস থেকে আপলোড করুন"
              className="w-full pl-3.5 pr-28 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-gray-900 font-mono text-xs"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={() => mainFileInputRef.current?.click()}
                title="Upload up to 5 images from device"
                className="px-2.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold shadow-xs"
              >
                <FolderUp className="w-3.5 h-3.5" />
                <span>ছবি আপলোড ({[mainImageUrl, ...galleryImages].filter(Boolean).length}/5)</span>
              </button>
            </div>
          </div>

          {/* Preview Grid for up to 5 images */}
          {[mainImageUrl, ...galleryImages].filter(Boolean).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {[mainImageUrl, ...galleryImages].filter(Boolean).map((imgUrl, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border-2 border-gray-200 aspect-square bg-gray-50">
                  <img src={imgUrl} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const current = [mainImageUrl, ...galleryImages].filter(Boolean);
                      const updated = current.filter((_, i) => i !== idx);
                      setMainImageUrl(updated[0] || '');
                      setGalleryImages(updated.slice(1));
                    }}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-lg opacity-90 hover:opacity-100 cursor-pointer shadow-md transition-all"
                    title="ছবি মুছুন"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-blue-600 text-white text-[9px] font-bold text-center py-0.5">
                      প্রধান ছবি (Cover)
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 4: Description & Rich Text Editor */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-blue-600 transition-all">
            {/* WYSIWYG Toolbar matching image */}
            <div className="bg-gray-50/80 border-b border-gray-200 px-3 py-2 flex flex-wrap items-center justify-between gap-1 select-none">
              {/* Left Formats */}
              <div className="flex flex-wrap items-center gap-0.5 text-gray-600">
                <button
                  type="button"
                  onClick={() => handleFormatText('bold')}
                  className="p-1.5 hover:bg-gray-200 rounded hover:text-gray-900 transition-colors cursor-pointer"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('italic')}
                  className="p-1.5 hover:bg-gray-200 rounded hover:text-gray-900 transition-colors cursor-pointer"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('underline')}
                  className="p-1.5 hover:bg-gray-200 rounded hover:text-gray-900 transition-colors cursor-pointer"
                  title="Underline"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-gray-300 mx-1" />

                <button
                  type="button"
                  onClick={() => handleFormatText('h1')}
                  className="p-1 hover:bg-gray-200 rounded text-xs font-bold hover:text-gray-900 transition-colors cursor-pointer px-1.5"
                  title="Heading 1"
                >
                  H₁
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('h2')}
                  className="p-1 hover:bg-gray-200 rounded text-xs font-bold hover:text-gray-900 transition-colors cursor-pointer px-1.5"
                  title="Heading 2"
                >
                  H₂
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('h3')}
                  className="p-1 hover:bg-gray-200 rounded text-xs font-bold hover:text-gray-900 transition-colors cursor-pointer px-1.5"
                  title="Heading 3"
                >
                  H₃
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('text')}
                  className="p-1.5 hover:bg-gray-200 rounded hover:text-gray-900 transition-colors cursor-pointer"
                  title="Normal Text"
                >
                  <Type className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-gray-300 mx-1" />

                <button
                  type="button"
                  onClick={() => handleFormatText('list')}
                  className="p-1.5 hover:bg-gray-200 rounded hover:text-gray-900 transition-colors cursor-pointer"
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('numbered-list')}
                  className="p-1.5 hover:bg-gray-200 rounded hover:text-gray-900 transition-colors cursor-pointer"
                  title="Numbered List"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('quote')}
                  className="p-1.5 hover:bg-gray-200 rounded hover:text-gray-900 transition-colors cursor-pointer"
                  title="Blockquote"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('code')}
                  className="p-1.5 hover:bg-gray-200 rounded hover:text-gray-900 transition-colors cursor-pointer"
                  title="Code"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('hr')}
                  className="p-1.5 hover:bg-gray-200 rounded hover:text-gray-900 transition-colors cursor-pointer"
                  title="Horizontal Rule"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-gray-300 mx-1" />

                <button
                  type="button"
                  className="p-1.5 hover:bg-gray-200 rounded hover:text-gray-900 transition-colors cursor-pointer"
                  title="Align Left"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-gray-200 rounded hover:text-gray-900 transition-colors cursor-pointer"
                  title="Align Center"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-gray-200 rounded hover:text-gray-900 transition-colors cursor-pointer"
                  title="Align Right"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-gray-300 mx-1" />

                <button
                  type="button"
                  onClick={() => handleFormatText('link')}
                  className="p-1.5 hover:bg-gray-200 rounded hover:text-gray-900 transition-colors cursor-pointer"
                  title="Insert Link"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('bold')}
                  className="p-1.5 hover:bg-gray-200 rounded hover:text-gray-900 transition-colors cursor-pointer"
                  title="Insert Image"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('hr')}
                  className="p-1.5 hover:bg-gray-200 rounded hover:text-gray-900 transition-colors cursor-pointer"
                  title="Table"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Right Mode Toggle: Visual | Preview | <> HTML */}
              <div className="flex items-center gap-1 bg-gray-200/70 p-0.5 rounded-lg text-[11px] font-semibold text-gray-600">
                <button
                  type="button"
                  onClick={() => setDescriptionMode('visual')}
                  className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    descriptionMode === 'visual' ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'
                  }`}
                  title="এডিট মোড"
                >
                  Visual (এডিট)
                </button>
                <button
                  type="button"
                  onClick={() => setDescriptionMode('preview')}
                  className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    descriptionMode === 'preview' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-gray-900'
                  }`}
                  title="লাইভ প্রিভিউ দেখুন"
                >
                  <Eye className="w-3 h-3" />
                  <span>প্রিভিউ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDescriptionMode('html')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    descriptionMode === 'html' ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'
                  }`}
                  title="HTML কোড মোড"
                >
                  <span>&lt;&gt;</span>
                  <span>HTML</span>
                </button>
              </div>
            </div>

            {/* Description Editor / Live Preview Display */}
            {descriptionMode === 'preview' ? (
              <div className="p-4 bg-gray-50/70 min-h-[190px] border-t border-gray-200">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ক্লায়েন্ট পেজে যেভাবে প্রদর্শিত হবে (Live Client View Preview):
                  </div>
                  <RichDescriptionRenderer content={description} />
                </div>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  id="product-description-editor"
                  rows={8}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="পণ্য সম্পর্কে বিস্তারিত তথ্য লিখুন (এন্টার দিয়ে নতুন লাইন, স্পেস বা বুলেট পয়েন্ট ব্যবহার করতে পারেন)..."
                  className="w-full p-4 bg-white text-sm text-gray-800 focus:outline-none resize-y leading-relaxed font-sans whitespace-pre-wrap selection:bg-emerald-100"
                />
                <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-150 flex items-center justify-between text-[11px] text-gray-500">
                  <span>💡 যেকোনো স্পেস, এন্টার বা নতুন প্যারাগ্রাফ হুবহু কাস্টমার পেজে দেখা যাবে।</span>
                  <button
                    type="button"
                    onClick={() => setDescriptionMode('preview')}
                    className="text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                  >
                    লাইভ প্রিভিউ দেখুন →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 5: Tags (comma separated) */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tags (comma separated)</label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="bestseller, new"
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-gray-900"
          />
        </div>

        {/* Row 6: In Stock Toggle | Stock Count | Min Purchase Qty */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-1">
          {/* Toggle: In Stock */}
          <div className="flex items-center gap-3 pt-4 sm:pt-0">
            <button
              type="button"
              onClick={() => setInStock(!inStock)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                inStock ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
            <span className="text-xs font-semibold text-gray-800">In Stock</span>
          </div>

          {/* Stock Count */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Stock Count</label>
            <input
              type="number"
              value={stockCount}
              onChange={e => setStockCount(e.target.value)}
              placeholder="Empty = unlimited"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-gray-900"
            />
          </div>

          {/* Min Purchase Qty */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Min Purchase Qty</label>
            <input
              type="number"
              min="1"
              value={minPurchaseQty}
              onChange={e => setMinPurchaseQty(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-gray-900"
            />
            <span className="block text-[11px] text-gray-400 mt-1">Customer must buy at least this many.</span>
          </div>
        </div>

        {/* Row 7: Toggles (Best Seller, New Arrival, Premium Collection) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Best Seller */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsBestSeller(!isBestSeller)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                isBestSeller ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
            <span className="text-xs font-semibold text-gray-800">Best Seller</span>
          </div>

          {/* New Arrival */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsNewArrival(!isNewArrival)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                isNewArrival ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
            <span className="text-xs font-semibold text-gray-800">New Arrival</span>
          </div>

          {/* Premium Collection */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPremiumCollection(!isPremiumCollection)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                isPremiumCollection ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
            <span className="text-xs font-semibold text-gray-800">Premium Collection</span>
          </div>
        </div>

        {/* ACCORDION SECTIONS (Matching image) */}
        <div className="border border-gray-200 rounded-2xl divide-y divide-gray-200 overflow-hidden mt-6">
          {/* 1. SEO & Meta Tags */}
          <div>
            <button
              type="button"
              onClick={() => toggleAccordion('seo')}
              className="w-full p-4 flex items-center justify-between bg-white hover:bg-gray-50/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">SEO & Meta Tags</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedAccordions.seo ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedAccordions.seo && (
              <div className="p-4 bg-gray-50/50 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={e => setSeoTitle(e.target.value)}
                    placeholder="Buy Pure Organic Honey Online | Arishten Bangladesh"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Meta Description</label>
                  <textarea
                    rows={2}
                    value={seoDescription}
                    onChange={e => setSeoDescription(e.target.value)}
                    placeholder="100% pure organic sundarban honey delivered fast across Bangladesh."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Meta Keywords</label>
                    <input
                      type="text"
                      value={seoKeywords}
                      onChange={e => setSeoKeywords(e.target.value)}
                      placeholder="organic honey, kalijira honey, mustard oil"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Canonical URL</label>
                    <input
                      type="text"
                      value={canonicalUrl}
                      onChange={e => setCanonicalUrl(e.target.value)}
                      placeholder="https://arishten.com/products/sundarban-honey"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Image Gallery */}
          <div>
            <button
              type="button"
              onClick={() => toggleAccordion('gallery')}
              className="w-full p-4 flex items-center justify-between bg-white hover:bg-gray-50/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">
                  Image Gallery ({galleryImages.length} / 5 ছবি)
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedAccordions.gallery ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedAccordions.gallery && (
              <div className="p-4 bg-gray-50/50 space-y-3 text-xs">
                <p className="text-gray-500 font-medium">
                  লক্যাল ডিভাইস থেকে একসাথে বা একটি একটি করে সর্বোচ্চ ৫টি ছবি সিলেক্ট করে আপলোড করতে পারেন। ক্লায়েন্ট পেজে গ্রাহকরা এগুলো স্লাইড করে দেখতে পারবেন।
                </p>

                {/* Hidden File Input for Gallery */}
                <input
                  type="file"
                  multiple
                  ref={galleryFileInputRef}
                  onChange={handleGalleryFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newGalleryInput}
                    onChange={e => setNewGalleryInput(e.target.value)}
                    placeholder="অতিরিক্ত ছবির URL দিন (https://...)"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddGalleryImage}
                      className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      URL যোগ
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryFileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <FolderUp className="w-3.5 h-3.5" />
                      <span>ডিভাইস থেকে ৫টি পর্যন্ত আপলোড</span>
                    </button>
                  </div>
                </div>

                {galleryImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {galleryImages.map((img, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-100">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(i)}
                          className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg opacity-90 hover:opacity-100 cursor-pointer shadow-md transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. YouTube Video */}
          <div>
            <button
              type="button"
              onClick={() => toggleAccordion('youtube')}
              className="w-full p-4 flex items-center justify-between bg-white hover:bg-gray-50/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">YouTube Video</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedAccordions.youtube ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedAccordions.youtube && (
              <div className="p-4 bg-gray-50/50 space-y-2 text-xs">
                <label className="block font-semibold text-gray-700">YouTube Video Embed Link / Video ID</label>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl"
                />
              </div>
            )}
          </div>

          {/* 4. Product Variants (0) */}
          <div>
            <button
              type="button"
              onClick={() => toggleAccordion('variants')}
              className="w-full p-4 flex items-center justify-between bg-white hover:bg-gray-50/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">
                  Product Variants ({variants.length})
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedAccordions.variants ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedAccordions.variants && (
              <div className="p-4 bg-gray-50/50 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={varName}
                    onChange={e => setVarName(e.target.value)}
                    placeholder="ভ্যারিয়েন্ট নাম (e.g. 500g Jar)"
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl"
                  />
                  <input
                    type="text"
                    value={varWeight}
                    onChange={e => setVarWeight(e.target.value)}
                    placeholder="ওজন / সাইজ (500g)"
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl"
                  />
                  <input
                    type="number"
                    value={varPrice}
                    onChange={e => setVarPrice(e.target.value)}
                    placeholder="মূল্য (৳)"
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 cursor-pointer"
                  >
                    ভ্যারিয়েন্ট যোগ করুন
                  </button>
                </div>

                {variants.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {variants.map(v => (
                      <div key={v.id} className="p-2.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between">
                        <span className="font-semibold text-gray-800">{v.name} ({v.weight})</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-blue-600">৳{v.price}</span>
                          <span className="text-gray-400">Stock: {v.stock}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(v.id)}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. Specifications (0) */}
          <div>
            <button
              type="button"
              onClick={() => toggleAccordion('specifications')}
              className="w-full p-4 flex items-center justify-between bg-white hover:bg-gray-50/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">
                  Specifications ({specifications.length})
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedAccordions.specifications ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedAccordions.specifications && (
              <div className="p-4 bg-gray-50/50 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newSpecKey}
                    onChange={e => setNewSpecKey(e.target.value)}
                    placeholder="বৈশিষ্ট্য (যেমন: গ্রেড, প্রসেসিং)"
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl"
                  />
                  <input
                    type="text"
                    value={newSpecValue}
                    onChange={e => setNewSpecValue(e.target.value)}
                    placeholder="মান (যেমন: গ্রেড-১, কোল্ড প্রেসড)"
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecification}
                    className="px-3 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 cursor-pointer"
                  >
                    স্পেসিফিকেশন যোগ করুন
                  </button>
                </div>

                {specifications.map(s => (
                  <div key={s.id} className="p-2.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-800">{s.key}: </span>
                      <span className="text-gray-600">{s.value}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecification(s.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Q&A (0) */}
          <div>
            <button
              type="button"
              onClick={() => toggleAccordion('qna')}
              className="w-full p-4 flex items-center justify-between bg-white hover:bg-gray-50/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">
                  Q&A ({qnaList.length})
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedAccordions.qna ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedAccordions.qna && (
              <div className="p-4 bg-gray-50/50 space-y-3 text-xs">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                    placeholder="প্রশ্ন (Customer Question)"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl"
                  />
                  <textarea
                    rows={2}
                    value={newAnswer}
                    onChange={e => setNewAnswer(e.target.value)}
                    placeholder="উত্তর (Answer)"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddQna}
                      className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 cursor-pointer"
                    >
                      প্রশ্ন ও উত্তর যোগ করুন
                    </button>
                  </div>
                </div>

                {qnaList.map(q => (
                  <div key={q.id} className="p-3 bg-white border border-gray-200 rounded-xl flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">Q: {q.question}</p>
                      <p className="text-gray-600 mt-0.5">A: {q.answer}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveQna(q.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer shrink-0 mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Buttons matching image: Create Product (Blue) | Cancel (White/Gray) */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Create Product</span>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold text-sm rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
