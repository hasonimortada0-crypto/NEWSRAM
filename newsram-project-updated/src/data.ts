import { Product, Category } from './types';
import productsData from './products.json';

export const USD_TO_IQD = 1500; // سعر الصرف الثابت المستخدم في المتجر لتسهيل الحساب

export const CATEGORIES: Category[] = [
  {
    id: 'lighting-indoor',
    name: 'الإنارة الداخلية',
    icon: 'Lightbulb',
    description: 'ثريات فاخرة، سبوتات LED، إضاءة مخفية، ومصابيح ديكورية معاصرة.'
  },
  {
    id: 'lighting-outdoor',
    name: 'الإنارة الخارجية والحدائق',
    icon: 'Sun',
    description: 'إضاءة حدائق مقاومة للماء والظروف الجوية، كشافات طاقة شمسية، وإنارة جدارية.'
  },
  {
    id: 'smart-switches',
    name: 'المفاتيح والذكاء المنزلي',
    icon: 'Cpu',
    description: 'مفاتيح لمس زجاجية راقية، مآخذ ذكية، وحلول التحكم بالإنارة عبر الهاتف.'
  },
  {
    id: 'appliances',
    name: 'التهوية والأجهزة المنزلية',
    icon: 'Wind',
    description: 'مراوح سقفية ديكورية، مراوح شفط صامتة، ومستلزمات الحماية والتحكم في الجهد.'
  },
  {
    id: 'electrical-supplies',
    name: 'الأسلاك والتأسيسات',
    icon: 'Cable',
    description: 'أسلاك نحاسية نقية معزولة، قواطع دورة (جوزات) أصلية، ومستلزمات التأسيس الكهربائي.'
  }
];

export const PRODUCTS: Product[] = productsData as Product[];
