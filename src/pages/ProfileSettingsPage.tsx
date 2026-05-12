import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, CheckCircle2, AlertCircle, RefreshCw, LogOut, ArrowLeft, Bot, MessageSquare, ExternalLink, ShieldCheck } from 'lucide-react';
import telegramService from '../services/telegramService';
import type { TelegramStatus, LinkTokenResponse } from '../services/telegramService';
import { toast } from 'react-toastify';

const ProfileSettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<TelegramStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [linkingData, setLinkingData] = useState<LinkTokenResponse | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchStatus = async () => {
        try {
            const data = await telegramService.getStatus();
            setStatus(data);
        } catch (error) {
            console.error("Failed to fetch telegram status", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleLink = async () => {
        setIsGenerating(true);
        try {
            const data = await telegramService.generateLinkToken();
            setLinkingData(data);
            window.open(data.botUrl, '_blank');
        } catch (error) {
            toast.error("Не удалось сгенерировать токен");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUnlink = async () => {
        if (!window.confirm("Вы уверены, что хотите отвязать Telegram?")) return;
        try {
            await telegramService.unlink();
            toast.success("Telegram успешно отвязан");
            setLinkingData(null);
            fetchStatus();
        } catch (error) {
            toast.error("Ошибка при отвязке");
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <RefreshCw className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-lp-bg py-8 px-4 sm:px-8 text-lp-text">
            <div className="max-w-3xl mx-auto">
                {/* Back Navigation */}
                <button 
                    onClick={() => navigate(-1)} 
                    className="group flex items-center gap-2 text-lp-text2 hover:text-lp-text transition-colors mb-8 font-medium w-fit"
                >
                    <div className="p-1.5 rounded-md bg-lp-surface border border-lp-border group-hover:bg-lp-surface2 shadow-sm transition-all">
                        <ArrowLeft size={18} />
                    </div>
                    <span>Назад</span>
                </button>
                
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-lp-text tracking-tight">Настройки профиля</h1>
                    <p className="text-lp-text2 mt-2 text-sm leading-relaxed max-w-xl">
                        Управляйте привязанными аккаунтами и каналами связи. Включите уведомления, чтобы не пропустить важные системные алерты и приглашения.
                    </p>
                </div>
                
                {/* Main Card System */}
                <div className="bg-lp-surface rounded-2xl shadow-xl shadow-black/5 border border-lp-border overflow-hidden mb-8 transition-all">
                    {/* Card Header section */}
                    <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-lp-border bg-lp-surface2/30">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-gradient-to-br from-lp-accent to-lp-accent2 text-white rounded-xl shadow-md shadow-lp-accent/20 shrink-0">
                                <Send size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-lp-text">Интеграция с Telegram</h2>
                                <p className="text-sm text-lp-text2 mt-1 max-w-sm">
                                    Автоматическая доставка приглашений в рабочие пространства и мгновенные уведомления о статусах.
                                </p>
                            </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="shrink-0">
                            {status?.isLinked ? (
                                <div className="inline-flex items-center gap-2 text-lp-green bg-lp-green/10 border border-lp-green/20 px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                                    <CheckCircle2 size={18} className="text-lp-green" />
                                    Привязано успешно
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 text-lp-text2 bg-lp-surface3 border border-lp-border px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                                    <AlertCircle size={18} className="text-lp-text3" />
                                    Не привязано
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 sm:p-8">
                        {status?.isLinked ? (
                            <div className="space-y-6">
                                <div className="flex items-start gap-4 p-5 bg-lp-green/5 border border-lp-green/10 rounded-xl">
                                    <ShieldCheck className="text-lp-green shrink-0 mt-0.5" size={24} />
                                    <div>
                                        <h4 className="text-lp-green font-semibold mb-1">Оповещения активны</h4>
                                        <p className="text-sm text-lp-text2 leading-relaxed">
                                            Ваш аккаунт надежно привязан к системе. Теперь коллеги могут отправлять вам приглашения прямо в мессенджер, минуя почту.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleUnlink}
                                        className="flex items-center gap-2 text-rose-400 hover:text-rose-500 hover:bg-rose-500/5 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors"
                                    >
                                        <LogOut size={18} />
                                        Отвязать аккаунт от Telegram
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {linkingData && !status?.isLinked && (
                                    <div className="p-5 bg-lp-accent/5 border border-lp-accent/10 rounded-xl relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-lp-accent animate-pulse"></div>
                                        <div className="flex items-start gap-4">
                                            <div className="shrink-0 mt-1">
                                                <RefreshCw className="text-lp-accent animate-spin" size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-lp-accent font-semibold mb-1">Ожидание связи с мессенджером...</h4>
                                                <p className="text-sm text-lp-text2 mb-2">
                                                    Мы ожидаем подтверждения с вашей стороны в Telegram. 
                                                </p>
                                                <a 
                                                    href={linkingData.botUrl} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-lp-accent hover:text-lp-accent2 bg-lp-surface px-3 py-1.5 rounded-md shadow-sm border border-lp-border transition-colors"
                                                >
                                                    <ExternalLink size={14} />
                                                    Запустить телеграм вручную
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center w-full">
                                    <button
                                        onClick={handleLink}
                                        disabled={isGenerating}
                                        className={`
                                            flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white transition-all
                                            ${isGenerating 
                                                ? 'bg-lp-accent/50 cursor-not-allowed' 
                                                : 'bg-gradient-to-r from-lp-accent to-lp-accent2 hover:from-lp-accent hover:to-lp-accent2 shadow-lg shadow-lp-accent/30 hover:shadow-lp-accent/40 hover:-translate-y-0.5 active:translate-y-0'
                                            }
                                        `}
                                    >
                                        {isGenerating ? (
                                            <RefreshCw className="animate-spin" size={20} />
                                        ) : (
                                            <Send size={20} />
                                        )}
                                        {isGenerating ? 'Создание ссылки...' : 'Привязать Telegram аккаунт'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Instructions Block */}
                {!status?.isLinked && (
                    <div className="bg-lp-surface rounded-2xl shadow-sm border border-lp-border p-6 sm:p-8">
                        <h3 className="text-lg font-bold text-lp-text mb-6">Как проходит привязка?</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
                            {/* Connecting Line */}
                            <div className="hidden sm:block absolute top-6 left-[10%] right-[10%] h-0.5 bg-lp-border z-0"></div>
 
                            {/* Step 1 */}
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-lp-surface border-2 border-lp-accent rounded-full flex items-center justify-center text-lp-accent mb-4 shadow-sm">
                                    <Send size={20} />
                                </div>
                                <h4 className="text-sm font-bold text-lp-text mb-2">Нажмите кнопку</h4>
                                <p className="text-xs text-lp-text2 leading-relaxed">Система сгенерирует безопасный ключ и перенаправит вас.</p>
                            </div>
                            
                            {/* Step 2 */}
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-lp-surface border-2 border-lp-border rounded-full flex items-center justify-center text-lp-text3 mb-4 shadow-sm">
                                    <Bot size={20} />
                                </div>
                                <h4 className="text-sm font-bold text-lp-text mb-2">Откройте бота</h4>
                                <p className="text-xs text-lp-text2 leading-relaxed">Ваш мессенджер откроет официальный бот DockFlow Assistant.</p>
                            </div>
 
                            {/* Step 3 */}
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-lp-surface border-2 border-lp-border rounded-full flex items-center justify-center text-lp-text3 mb-4 shadow-sm">
                                    <MessageSquare size={20} />
                                </div>
                                <h4 className="text-sm font-bold text-lp-text mb-2">Нажмите Start</h4>
                                <p className="text-xs text-lp-text2 leading-relaxed">Одно нажатие — и ваш аккаунт навсегда привязан к системе.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSettingsPage;

