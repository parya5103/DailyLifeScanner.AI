'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, Download, Filter, TrendingUp, Users, FileText, Bell, User, LogOut } from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: string;
  publishedAt: string;
  summary: string;
  impactStudent?: string;
  impactEmployee?: string;
  impactInvestor?: string;
  impactHomemaker?: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  preferences: {
    profile: string;
    categories: string[];
    interests?: string;
    language: string;
    timezone: string;
    notifications: boolean;
  };
}

const CATEGORIES = ['all', 'technology', 'business', 'science', 'health', 'sports', 'entertainment'];
const PROFILES = ['all', 'student', 'employee', 'investor', 'homemaker'];

const CATEGORY_COLORS = {
  technology: 'bg-blue-100 text-blue-800',
  business: 'bg-green-100 text-green-800',
  science: 'bg-purple-100 text-purple-800',
  health: 'bg-red-100 text-red-800',
  sports: 'bg-yellow-100 text-yellow-800',
  entertainment: 'bg-pink-100 text-pink-800',
  general: 'bg-gray-100 text-gray-800'
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProfile, setSelectedProfile] = useState('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      // Set user's preferred profile and categories
      setSelectedProfile(user.preferences.profile);
      if (user.preferences.categories.length > 0) {
        setSelectedCategory(user.preferences.categories[0]);
      }
      fetchNews();
    }
  }, [user]);

  const checkAuth = async () => {
    setAuthLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAuthLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('authToken');
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchNews = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedProfile !== 'all') params.append('profile', selectedProfile);
      params.append('limit', '20');

      const response = await fetch(`/api/news?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setArticles(data.data);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrapeNews = async () => {
    if (!user) return;
    
    setScraping(true);
    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scrape' })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchNews(); // Refresh the news list
      }
    } catch (error) {
      console.error('Error scraping news:', error);
    } finally {
      setScraping(false);
    }
  };

  const exportToPDF = async () => {
    if (!user) return;
    
    setExporting(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: selectedProfile,
          category: selectedCategory
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Create a blob and download it
        const blob = new Blob([data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
      localStorage.removeItem('authToken');
      setUser(null);
      setArticles([]);
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('authToken');
      setUser(null);
      setArticles([]);
      router.refresh();
    }
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getImpactText = (article: NewsArticle) => {
    if (selectedProfile === 'all') return null;
    const impactField = `impact${selectedProfile.charAt(0).toUpperCase() + selectedProfile.slice(1)}` as keyof NewsArticle;
    return article[impactField];
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">DailyLifeScanner.AI</h1>
                  <p className="text-sm text-gray-600">Personalized news insights for your lifestyle</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Get Personalized News Insights
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              DailyLifeScanner.AI uses advanced AI to analyze news and show you how it affects your lifestyle. 
              Get personalized insights based on your profile - whether you're a student, employee, investor, or homemaker.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>Personalized</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Get news insights tailored to your profile and interests
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-green-600" />
                    <span>Real-time</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Stay updated with the latest news and AI analysis
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <span>Exportable</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Export daily summaries to PDF for offline reading
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DailyLifeScanner.AI</h1>
                <p className="text-sm text-gray-600">Welcome back, {user.name || user.email}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Button
                onClick={scrapeNews}
                disabled={scraping}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${scraping ? 'animate-spin' : ''}`} />
                {scraping ? 'Scraping...' : 'Refresh News'}
              </Button>
              <Button
                onClick={exportToPDF}
                disabled={exporting || filteredArticles.length === 0}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Articles</p>
                  <p className="text-2xl font-bold">{filteredArticles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Your Profile</p>
                  <p className="text-lg font-semibold capitalize">{selectedProfile}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="text-lg font-semibold capitalize">{selectedCategory}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-sm font-medium">Just now</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFILES.map(profile => (
                      <SelectItem key={profile} value={profile}>
                        {profile.charAt(0).toUpperCase() + profile.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Articles List */}
        <div className="space-y-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))
          ) : filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'No articles match your search criteria.' : 'No articles available. Try refreshing the news.'}
                </p>
                <Button onClick={scrapeNews} disabled={scraping}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${scraping ? 'animate-spin' : ''}`} />
                  {scraping ? 'Scraping...' : 'Refresh News'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Articles
            filteredArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors"
                        >
                          {article.title}
                        </a>
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={CATEGORY_COLORS[article.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.general}>
                          {article.category}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {article.source} • {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    {article.description}
                  </CardDescription>
                  
                  {article.summary && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">AI Summary:</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {article.summary}
                      </p>
                    </div>
                  )}
                  
                  {getImpactText(article) && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">
                        Impact on {selectedProfile}s:
                      </h4>
                      <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                        {getImpactText(article)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
