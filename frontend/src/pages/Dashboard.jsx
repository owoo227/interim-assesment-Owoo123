import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Logo from '../components/ui/Logo';
import Loader from '../components/ui/Loader';

const TABS = ['All Coins', 'Top Gainers', 'New Listings'];

const CryptoTable = ({ coins, loading }) => {
  if (loading) return <Loader fullScreen={false} />;
  if (!coins.length) return <p className="text-[#8A919E] py-4">No data available.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[#5B616E] border-b border-[#1E2025]">
            <th className="text-left py-3 pr-4 font-semibold">Asset</th>
            <th className="text-right py-3 pr-4 font-semibold">Price</th>
            <th className="text-right py-3 font-semibold">24h Change</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((c) => (
            <tr key={c._id} className="border-b border-[#1E2025] last:border-0 hover:bg-[#1E2025] transition-colors">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  {c.image
                    ? <img src={c.image} alt={c.symbol} className="w-8 h-8 rounded-full object-cover" />
                    : <div className="w-8 h-8 rounded-full bg-[#2C2F36] flex items-center justify-center text-xs font-bold text-[#8A919E]">{c.symbol?.[0]}</div>
                  }
                  <div>
                    <p className="font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-[#5B616E] uppercase">{c.symbol}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4 text-right font-semibold">
                ${Number(c.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </td>
              <td className={`py-3 text-right font-semibold ${c.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {c.change24h >= 0 ? '+' : ''}{Number(c.change24h ?? 0).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AddCryptoForm = ({ onAdded }) => {
  const [form, setForm] = useState({ name: '', symbol: '', price: '', image: '', change24h: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = {
      name: form.name.trim(),
      symbol: form.symbol.trim().toUpperCase(),
      price: parseFloat(form.price),
      image: form.image.trim() || undefined,
      change24h: form.change24h !== '' ? parseFloat(form.change24h) : undefined,
    };
    try {
      const { data } = await api.post('/crypto', payload);
      const newCoin = data.coin ?? data.crypto ?? data;
      setForm({ name: '', symbol: '', price: '', image: '', change24h: '' });
      onAdded(newCoin);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        setError(data.errors.map((e) => e.msg).join(' · '));
      } else {
        setError(data?.message || 'Failed to add crypto.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full h-11 px-4 rounded-xl bg-[#1E2025] border border-[#2C2F36] text-white placeholder:text-[#5B616E] text-sm outline-none focus:border-[#0052FF] transition-colors';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#8A919E] mb-1">Name *</label>
          <input className={inputCls} placeholder="Bitcoin" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#8A919E] mb-1">Symbol *</label>
          <input className={inputCls} placeholder="BTC" value={form.symbol} onChange={set('symbol')} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#8A919E] mb-1">Price (USD) *</label>
          <input className={inputCls} type="number" step="any" min="0" placeholder="60000" value={form.price} onChange={set('price')} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#8A919E] mb-1">24h Change (%)</label>
          <input className={inputCls} type="number" step="any" placeholder="+2.5" value={form.change24h} onChange={set('change24h')} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#8A919E] mb-1">Image URL</label>
        <input className={inputCls} placeholder="https://... or data:image/..." value={form.image} onChange={set('image')} />
      </div>
      {error && (
        <div className="w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-full bg-[#0052FF] hover:bg-[#1a5cff] disabled:bg-[#1E2025] disabled:text-[#5B616E] text-white font-semibold text-sm transition-colors mt-1"
      >
        {loading ? 'Adding…' : 'Add Cryptocurrency'}
      </button>
    </form>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loadingWallets, setLoadingWallets] = useState(true);

  const [activeTab, setActiveTab] = useState(0);
  const [allCoins, setAllCoins] = useState([]);
  const [gainers, setGainers] = useState([]);
  const [newListings, setNewListings] = useState([]);
  const [loadingCrypto, setLoadingCrypto] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchCrypto = () => {
    setLoadingCrypto(true);
    Promise.all([
      api.get('/crypto'),
      api.get('/crypto/gainers'),
      api.get('/crypto/new'),
    ])
      .then(([all, g, n]) => {
        setAllCoins(all.data.coins ?? all.data.cryptos ?? all.data);
        setGainers(g.data.coins ?? g.data.cryptos ?? g.data);
        setNewListings(n.data.coins ?? n.data.cryptos ?? n.data);
      })
      .catch(() => {})
      .finally(() => setLoadingCrypto(false));
  };

  useEffect(() => {
    Promise.all([
      api.get('/wallet/balances'),
      api.get('/wallet/portfolio'),
    ])
      .then(([wRes, pRes]) => {
        setWallets(wRes.data.wallets);
        setPortfolio(pRes.data);
      })
      .finally(() => setLoadingWallets(false));

    fetchCrypto();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/signin');
  };

  const tabCoins = [allCoins, gainers, newListings][activeTab];

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2025]">
        <a href="/">
          <Logo height={28} className="brightness-0 invert" />
        </a>
        <button
          onClick={handleLogout}
          className="px-5 py-2 rounded-full bg-[#1E2025] hover:bg-[#2C2F36] text-[0.9rem] font-semibold transition-colors"
        >
          Sign out
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-6">
        {/* Profile section */}
        <div className="bg-[#16181C] rounded-2xl p-6 border border-[#1E2025]">
          <h1 className="text-2xl font-bold mb-4">Profile</h1>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center py-3 border-b border-[#1E2025]">
              <span className="text-[#8A919E]">Name</span>
              <span className="font-semibold">{user?.name || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#1E2025]">
              <span className="text-[#8A919E]">Email</span>
              <span className="font-semibold">{user?.email || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#1E2025]">
              <span className="text-[#8A919E]">Account type</span>
              <span className="font-semibold capitalize">{user?.accountType || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#1E2025]">
              <span className="text-[#8A919E]">Email verified</span>
              <span className={`font-semibold ${user?.isEmailVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                {user?.isEmailVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-[#8A919E]">KYC status</span>
              <span className="font-semibold capitalize">{user?.kycStatus || 'none'}</span>
            </div>
          </div>
        </div>

        {/* Portfolio summary */}
        {portfolio && (
          <div className="bg-[#16181C] rounded-2xl p-6 border border-[#1E2025]">
            <h2 className="text-xl font-bold mb-1">Portfolio</h2>
            <p className="text-3xl font-bold text-white mt-2">
              ${portfolio.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className={`text-sm mt-1 ${portfolio.change24hPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {portfolio.change24hPercent >= 0 ? '+' : ''}{portfolio.change24hPercent}% today
            </p>
          </div>
        )}

        {/* Wallets */}
        <div className="bg-[#16181C] rounded-2xl p-6 border border-[#1E2025]">
          <h2 className="text-xl font-bold mb-4">Wallets</h2>
          {loadingWallets ? (
            <Loader fullScreen={false} />
          ) : wallets.length === 0 ? (
            <p className="text-[#8A919E]">No wallets found.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {wallets.map((w) => (
                <div key={w._id} className="flex justify-between items-center py-3 border-b border-[#1E2025] last:border-0">
                  <div>
                    <span className="font-bold">{w.asset}</span>
                    <p className="text-xs text-[#5B616E] mt-0.5 font-mono truncate max-w-[200px]">{w.address}</p>
                  </div>
                  <span className="font-semibold">{w.balance} {w.asset}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crypto Market */}
        <div className="bg-[#16181C] rounded-2xl p-6 border border-[#1E2025]">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-bold">Crypto Market</h2>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="px-4 py-2 rounded-full bg-[#0052FF] hover:bg-[#1a5cff] text-white text-sm font-semibold transition-colors"
            >
              {showAddForm ? 'Cancel' : '+ Add Cryptocurrency'}
            </button>
          </div>

          {showAddForm && (
            <div className="mb-6 p-5 bg-[#0A0B0D] rounded-xl border border-[#2C2F36]">
              <h3 className="text-base font-semibold text-white mb-4">Add New Cryptocurrency</h3>
              <AddCryptoForm onAdded={(newCoin) => {
                setAllCoins((prev) => [newCoin, ...prev]);
                setActiveTab(0);
                setShowAddForm(false);
                fetchCrypto();
              }} />
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-[#0A0B0D] rounded-xl p-1">
            {TABS.map((t, i) => (
              <button
                key={t}
                onClick={() => setActiveTab(i)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === i ? 'bg-[#1E2025] text-white' : 'text-[#5B616E] hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <CryptoTable coins={tabCoins} loading={loadingCrypto} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
