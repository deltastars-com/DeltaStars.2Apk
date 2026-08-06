import React, { useState } from 'react';
import { Review } from '@/types';
import { StarIcon } from './lib/contexts/Icons';
import { useI18n } from './lib/contexts/I18nContext';

interface ProductReviewsProps {
    productId: number;
    reviews: Review[];
    averageRating: { average: number; count: number };
    onAddReview: (review: any) => void;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ 
    productId, 
    reviews, 
    averageRating, 
    onAddReview 
}) => {
    const { t, language } = useI18n();
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReview.comment.trim()) return;
        onAddReview({
            ...newReview,
            productId: productId,
            author: t('productDetail.anonymous'),
            date: new Date().toISOString()
        });
        setNewReview({ rating: 5, comment: '' });
    };

    return (
        <div className="mt-12 md:mt-24 bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] shadow-sovereign border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-16 gap-6 md:gap-8">
                <div className="text-center md:text-right">
                    <h2 className="text-3xl md:text-5xl font-black text-primary mb-2 tracking-tighter uppercase">
                        {t('productDetail.reviews')}
                    </h2>
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <StarIcon key={i} filled={i <= Math.round(averageRating.average)} className={`w-4 h-4 md:w-6 md:h-6 ${i <= Math.round(averageRating.average) ? 'text-yellow-500' : 'text-gray-200'}`} />
                            ))}
                        </div>
                        <span className="text-lg md:text-2xl font-black text-primary">{averageRating.average.toFixed(1)}</span>
                        <span className="text-xs md:text-base text-gray-400 font-bold">{t('productDetail.reviewsCount', { count: averageRating.count })}</span>
                    </div>
                </div>

                <div className="bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10">
                    <p className="text-primary font-black text-xs uppercase tracking-widest">
                        {t('productDetail.guaranteed')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16">
                <div className="lg:col-span-5">
                    <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-gray-100 sticky top-40">
                        <h3 className="text-xl md:text-2xl font-black text-primary mb-6 md:mb-8 uppercase tracking-tight">
                            {t('productDetail.addReview')}
                        </h3>

                        <div className="mb-6">
                            <p className="text-gray-400 font-black text-[9px] uppercase tracking-widest mb-3">
                                {t('productDetail.yourRating')}
                            </p>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setNewReview({ ...newReview, rating: i })}
                                        className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${newReview.rating >= i ? 'bg-yellow-500 text-white shadow-lg scale-105' : 'bg-white text-gray-300 border border-gray-100'}`}
                                    >
                                        <StarIcon filled={newReview.rating >= i} className="w-5 h-5 md:w-8 md:h-8" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6 md:mb-10">
                            <p className="text-gray-400 font-black text-[9px] uppercase tracking-widest mb-3">
                                {t('productDetail.yourComment')}
                            </p>
                            <textarea
                                required
                                value={newReview.comment}
                                onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                                placeholder={t('productDetail.commentPlaceholder')}
                                className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-medium text-base focus:border-primary outline-none min-h-[120px] transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 md:py-6 bg-primary text-white rounded-xl md:rounded-2xl font-black text-lg md:text-2xl shadow-xl hover:bg-secondary transition-all border-b-4 md:border-b-8 border-primary-dark active:border-b-0"
                        >
                            {t('productDetail.postReview')}
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-7 space-y-8">
                    {reviews.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100">
                            <p className="text-2xl font-bold text-gray-300 uppercase tracking-widest">
                                {t('productDetail.noReviews')}
                            </p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xl font-black text-primary mb-1">{review.author}</p>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <StarIcon key={i} filled={i <= review.rating} className={`w-4 h-4 ${i <= review.rating ? 'text-yellow-500' : 'text-gray-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-300">{new Date(review.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                                </div>
                                <p className="text-xl font-bold text-slate-700 leading-relaxed">
                                    {review.comment}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductReviews;
