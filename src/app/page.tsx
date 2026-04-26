import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Building2, Users, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col">
      {/* Navbar */}
      <header className="fixed top-0 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Building2 className="h-6 w-6 text-primary" />
            MyCorporate
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="rounded-xl font-medium hidden sm:flex">Login Karyawan</Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-xl font-medium shadow-md shadow-primary/20">Daftar Perusahaan</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col pt-32 pb-16">
        <section className="container mx-auto px-4 text-center space-y-8 max-w-4xl flex-1 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mx-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Enterprise ERP & SaaS Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Kelola Perusahaan & Karyawan dengan <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Lebih Cerdas</span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Solusi lengkap untuk manajemen SDM, absensi, cuti, dan operasional bisnis dalam satu platform terintegrasi.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/register">
              <Button size="lg" className="rounded-2xl h-14 px-8 text-lg font-semibold shadow-xl shadow-primary/20 w-full sm:w-auto">
                <Building2 className="mr-2 h-5 w-5" /> Daftar Sebagai Perusahaan <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/employee-register">
              <Button size="lg" variant="outline" className="rounded-2xl h-14 px-8 text-lg font-semibold w-full sm:w-auto border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <Users className="mr-2 h-5 w-5" /> Saya Karyawan
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-24">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Keamanan Enterprise</h3>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">Data perusahaan Anda dienkripsi dan diisolasi dengan teknologi Row Level Security level enterprise.</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Absensi Real-time</h3>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">Track jam masuk dan pulang karyawan secara live dengan deteksi keterlambatan otomatis.</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Portal Karyawan</h3>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">Karyawan dapat mengelola absensi dan pengajuan cuti kapan saja langsung dari portal mereka.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
