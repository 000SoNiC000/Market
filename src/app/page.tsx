'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Product, Category } from '@/types';
import ProductCard from '@/components/ProductCard';
import { useProductReviews } from '@/hooks/useProductReviews';
import BannerImage from '@/components/BannerImage';
import DynamicIcon from '@/components/DynamicIcon';

// Інтерфейс для головного банера
interface MainBanner {
  image_url: string;
  mobile_image_url?: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
}

// Функція для управління рейтингами товарів на головній сторінці
function useProductReviewsManager() {
  const [productReviews, setProductReviews] = useState<{[key: number]: {totalCount: number, averageRating: number}}>({});

  // Функція для отримання рейтингів для масиву продуктів
  const fetchReviewsBatch = useCallback(async (productIds: number[]) => {
    if (!productIds || productIds.length === 0) return;
    
    try {
      const response = await fetch(`/api/reviews/summary-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setProductReviews(data.reviews || {});
      }
    } catch (error) {
      console.error('Error fetching batch reviews:', error);
    }
  }, []);

  // Функція для отримання рейтингу продукту з кешу
  const getProductReview = useCallback((id: number) => {
    const review = productReviews[id] || { totalCount: 0, averageRating: 0 };
    // Преобразуем формат для совместимости с ProductCard
    return { 
      rating: review.averageRating, 
      count: review.totalCount 
    };
  }, [productReviews]);

  return { fetchReviewsBatch, getProductReview };
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainBanner, setMainBanner] = useState<MainBanner>({
    image_url: '',
    title: '',
    subtitle: '',
    button_text: 'Почати покупки',
    button_link: '/products'
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Cache-busting для зображень (щоб уникнути кешування браузером)
  const cacheBuster = useRef(`?v=${Date.now()}`).current;
  
  // Використовуємо ref для відстеження, чи завантажені дані
  const dataFetchedRef = useRef(false);
  
  // Карта відповідності категорій та їх зображень
  const categoryImages: {[key: string]: string} = {
    'glasses': '/images/categories/glasses.jpg',
    'home': '/images/categories/98821229-21fc-4e1b-a93f-3ba80bf77c6a.png',
    'tools': '/images/categories/tools.jpg',
    'kids': '/images/categories/c8abd22e-796f-4dd2-bca7-ef57c700551a.png'
  };
  
  // Функція для отримання іконки категорії
  const getCategoryIcon = (categoryData: Category) => {
    // Якщо категорія має завантажене зображення, використовуємо його
    if (categoryData.image) {
      return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img 
          src={categoryData.image} 
          alt={categoryData.name}
          className="w-6 h-6" 
        />
      );
    }
    
    // Якщо категорія має налаштовану іконку з бібліотеки, використовуємо її
    if (categoryData.icon) {
      return <DynamicIcon iconName={categoryData.icon} size={24} />;
    }
    
    // Інакше використовуємо іконку за замовчуванням на основі slug
    const slug = categoryData.slug;
    const iconMappings: {[key: string]: React.ReactNode} = {
      // Іконки для основних категорій
      'glass': (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      'home': (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      'tool': (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      'kid': (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      // Додаткові категорії, які можуть бути додані пізніше
      'book': (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      'tech': (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      'food': (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      'cloth': (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      'sport': (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      'default': (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )
    };
    
    // Ця функція перевіряє, чи є в slug ключові слова з iconMappings
    const findMatchingIcon = () => {
      for (const key in iconMappings) {
        if (slug.includes(key)) {
          return iconMappings[key];
        }
      }
      return iconMappings['default'];
    };
    
    return findMatchingIcon();
  };
  
  const { fetchReviewsBatch, getProductReview } = useProductReviewsManager();

  // Мемоізуємо функцію fetchData, щоб вона не створювалася заново при кожному рендері
  const fetchData = useCallback(async () => {
    // Якщо дані вже завантажені, нічого не робимо
    if (dataFetchedRef.current) return;
    
    try {
      setIsLoading(true);
      
      // Використовуємо Promise.all для паралельного завантаження даних
      const [bannerResponse, categoriesResponse, productsResponse] = await Promise.all([
        fetch('/api/settings/main_banner'),
        fetch('/api/categories'),
        fetch('/api/products?featured=true&limit=8')
      ]);
      
      // Обробляємо відповіді тільки якщо вони успішні
      if (bannerResponse.ok) {
        const bannerData = await bannerResponse.json();
        setMainBanner(bannerData);
      }
      
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      }
      
      if (productsResponse.ok) {
        const { products } = await productsResponse.json();
        setFeaturedProducts(products);
        
        // Завантажуємо рейтинги тільки якщо є продукти
        if (products && products.length > 0) {
          const productIds = products.map((p: Product) => p.id);
          fetchReviewsBatch(productIds);
        }
      }
      
      // Відзначаємо, що дані вже завантажені
      dataFetchedRef.current = true;
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchReviewsBatch]);
  
  // Викликаємо fetchData тільки при монтуванні компонента
  useEffect(() => {
    if (!dataFetchedRef.current) {
      fetchData();
    }

    // Діагностичний код для налагодження завантаження банерів
    console.log('Перевірка завантаження банерів:');
    console.log('Desktop banner:', mainBanner.image_url);
    console.log('Mobile banner:', mainBanner.mobile_image_url || 'використовується десктопна версія');
  }, [fetchData, mainBanner.image_url, mainBanner.mobile_image_url]);

  // Для налагодження - виводимо slug всіх категорій
  useEffect(() => {
    if (categories.length > 0) {
      console.log('Завантажені категорії:');
      categories.forEach(cat => {
        console.log(`ID: ${cat.id}, Name: ${cat.name}, Slug: ${cat.slug}, Image: ${cat.image}`);
        console.log(`Статичний шлях: ${categoryImages[cat.slug] || 'не знайдено'}`);
      });
    }
  }, [categories, categoryImages]);

  // Використовуємо useMemo для створення нового timestamp при кожному рендерингу
  // Це попередить кешування зображень між сесіями
  const imgUrlWithCacheBuster = useMemo(() => {
    const timestamp = Date.now();
    const mainBannerUrl = mainBanner.image_url + `?v=${timestamp}`;
    const mobileBannerUrl = (mainBanner.mobile_image_url || mainBanner.image_url) + `?v=${timestamp}`;
    return { desktop: mainBannerUrl, mobile: mobileBannerUrl };
  }, [mainBanner.image_url, mainBanner.mobile_image_url]);

  return (
    <Layout>
      {/* Hero секція */}
      <section className="relative h-[500px] md:h-[500px] bg-gray-100">
        <div className="absolute inset-0 z-0">
          {/* Зображення для десктопа (приховано на мобільних) */}
          <div className="relative w-full h-full hidden md:block">
            {mainBanner.image_url && (
              <BannerImage
                src={mainBanner.image_url}
                alt="MAKEPAY - інтернет магазин"
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            )}
          </div>
          
          {/* Зображення для мобільних (приховано на десктопі) */}
          <div className="relative w-full h-full block md:hidden">
            {(mainBanner.mobile_image_url || mainBanner.image_url) && (
              <BannerImage
                src={mainBanner.mobile_image_url || mainBanner.image_url}
                alt="MAKEPAY - інтернет магазин"
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            )}
          </div>
        </div>
        
        <div className="relative z-10 container mx-auto h-full flex items-center px-4">
          {/* Text content removed as per client request */}
        </div>
      </section>

      {/* Основний контент з категоріями ліворуч і товарами праворуч */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Сайдбар з категоріями у стилі Розетки (ліворуч) */}
          <div className="md:w-1/4">
            <h2 className="text-xl font-bold mb-4">Категорії товарів</h2>
            <div className="bg-white rounded-lg shadow-sm p-2 mb-6">
              <ul className="space-y-1">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link 
                      href={`/category/${category.slug}`}
                      className="flex items-center p-2 hover:bg-gray-50 rounded transition-colors group"
                    >
                      <div className="w-8 h-8 flex items-center justify-center text-gray-500 mr-3 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                        {getCategoryIcon(category)}
                      </div>
                      <div className="flex-1">
                        <span className="text-gray-700 group-hover:text-gray-900 font-medium">
                          {category.name}
                        </span>
                      </div>
                      
                      {/* Стрілка вправо */}
                      <div className="text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Популярні товари (праворуч) */}
          <div className="md:w-3/4">
            <h2 className="text-2xl font-bold mb-6">Популярні товари</h2>
            
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded mt-3 w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded mt-2 w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    reviewSummary={getProductReview(product.id)} 
                  />
                ))}
              </div>
            )}
            
            <div className="text-center mt-10">
              <Link
                href="/products"
                className="inline-block bg-gray-800 text-white px-6 py-3 font-medium rounded-md hover:bg-gray-700 transition"
              >
                Переглянути всі товари
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Переваги */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Наші переваги</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Якісні товари</h3>
              <p className="text-gray-600">Ми ретельно відбираємо товари від перевірених постачальників</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Швидка доставка</h3>
              <p className="text-gray-600">Відправляємо замовлення в день оформлення</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Зручна оплата</h3>
              <p className="text-gray-600">Оплачуйте замовлення онлайн або при отриманні</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
