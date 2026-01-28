'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  initials: string;
  createdAt: Date;
}

interface TeamInfo {
  name: string;
  language: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  about: string;
  logoUrl: string;
  useCardanAI: boolean;
}

const defaultTeamInfo: TeamInfo = {
  name: 'Shift2',
  language: 'Nederlands',
  address: 'Rembrandt 15, 2311 GN Capelle a/d IJssel',
  email: 'contact@shift2.nl',
  phone: '088 770 8811',
  website: 'https://www.shift2.nl/',
  about: 'Shift2 helpt lokale overheden tijdens bij innovaties in de aan waar digitale dienstverlening blijft van het super eenvoudig. Wij maken het super eenvoudig toegankelijk, waarbij digitaal begrijpelijk en een vast onderdeel van onze dienstverlening.',
  logoUrl: '/shift2-logo.svg',
  useCardanAI: true,
};

const defaultTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Erik Kerkhove',
    email: 'erik.kerkhove@shift2.nl',
    role: 'Beheerder',
    status: 'Actief',
    initials: 'EK',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Sharina van Putten',
    email: 'sharina.vanputten@shift2.nl',
    role: 'Beheerder',
    status: 'Actief',
    initials: 'SP',
    createdAt: new Date(),
  },
];

export default function TeamPage() {
  const [mounted, setMounted] = useState(false);
  const [showBeheerMenu, setShowBeheerMenu] = useState(false);
  const [teamInfo, setTeamInfo] = useState<TeamInfo>(defaultTeamInfo);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(defaultTeamMembers);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [editTeamFormData, setEditTeamFormData] = useState<TeamInfo>(defaultTeamInfo);
  const [newMemberFormData, setNewMemberFormData] = useState({
    name: '',
    email: '',
    role: 'Onderzoeker',
    language: 'Nederlands'
  });
  const [openMemberMenuId, setOpenMemberMenuId] = useState<string | null>(null);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editMemberFormData, setEditMemberFormData] = useState({
    name: '',
    email: '',
    role: 'Onderzoeker',
    language: 'Nederlands'
  });

  useEffect(() => {
    setMounted(true);
    // Load team info from API
    const fetchTeamInfo = async () => {
      try {
        const response = await fetch('/api/team');
        if (response.ok) {
          const data = await response.json();
          setTeamInfo(data);
        }
      } catch (error) {
        console.error('Error fetching team info:', error);
      }
    };

    fetchTeamInfo();

    // Load team members from localStorage (still using localStorage for members)
    if (typeof window !== 'undefined') {
      const savedTeamMembers = localStorage.getItem('teamMembers');
      if (savedTeamMembers) {
        const parsed = JSON.parse(savedTeamMembers);
        setTeamMembers(parsed.map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt),
        })));
      }
    }
  }, []);

  // Close Beheer menu on Escape key or click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowBeheerMenu(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showBeheerMenu && !target.closest('.beheer-button') && !target.closest('.beheer-menu')) {
        setShowBeheerMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBeheerMenu]);

  const saveTeamInfo = async () => {
    try {
      const response = await fetch('/api/team', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamInfo),
      });

      if (response.ok) {
        const updatedTeam = await response.json();
        setTeamInfo(updatedTeam);
        setIsEditingTeam(false);
        alert('Team informatie opgeslagen!');
      } else {
        alert('Fout bij opslaan van team informatie');
      }
    } catch (error) {
      console.error('Error saving team info:', error);
      alert('Fout bij opslaan van team informatie');
    }
  };

  const saveTeamMembers = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-shift2-primary text-white">
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin">
              <img
                src="/shift2-logo.svg"
                alt="Shift2"
                className="h-8"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>
            <nav className="flex gap-8 text-sm">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-white hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              <Link
                href="/onderzoeken"
                className="flex items-center gap-2 text-white hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Onderzoeken
              </Link>
              <Link
                href="/admin/bevindingen"
                className="flex items-center gap-2 text-white hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Bevindingen
              </Link>
              <div className="relative">
                <button
                  onClick={() => setShowBeheerMenu(!showBeheerMenu)}
                  className="beheer-button flex items-center gap-2 text-white hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Beheer
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Beheer Dropdown Menu */}
                {showBeheerMenu && (
                  <div className="beheer-menu absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/admin/onderzoekstypen"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Onderzoekstypen
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/projecten"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Projecten
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/opdrachtgevers"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Opdrachtgevers
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/crawler-tests"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Crawler tests
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/beoordelingen"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Beoordelingen
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/team"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Team
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="grid grid-cols-[2fr_3fr] gap-6">
          {/* Left Column - Team Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Team</h2>
              <button
                onClick={() => {
                  setEditTeamFormData(teamInfo);
                  setShowEditTeamModal(true);
                }}
                className="text-gray-500 hover:text-gray-900 cursor-pointer transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Naam</label>
                {isEditingTeam ? (
                  <input
                    type="text"
                    value={teamInfo.name}
                    onChange={(e) => setTeamInfo({ ...teamInfo, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <div className="w-full mt-1 text-gray-900">{teamInfo.name}</div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">Taal</label>
                {isEditingTeam ? (
                  <input
                    type="text"
                    value={teamInfo.language}
                    onChange={(e) => setTeamInfo({ ...teamInfo, language: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <div className="w-full mt-1 text-gray-900">{teamInfo.language}</div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">Adres</label>
                {isEditingTeam ? (
                  <input
                    type="text"
                    value={teamInfo.address}
                    onChange={(e) => setTeamInfo({ ...teamInfo, address: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <div className="w-full mt-1 text-gray-900">{teamInfo.address}</div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">E-mail</label>
                {isEditingTeam ? (
                  <input
                    type="email"
                    value={teamInfo.email}
                    onChange={(e) => setTeamInfo({ ...teamInfo, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <div className="w-full mt-1 text-gray-900">{teamInfo.email}</div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">Telefoon</label>
                {isEditingTeam ? (
                  <input
                    type="text"
                    value={teamInfo.phone}
                    onChange={(e) => setTeamInfo({ ...teamInfo, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <div className="w-full mt-1 text-gray-900">{teamInfo.phone}</div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">Website</label>
                {isEditingTeam ? (
                  <input
                    type="url"
                    value={teamInfo.website}
                    onChange={(e) => setTeamInfo({ ...teamInfo, website: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <div className="w-full mt-1 text-blue-600 underline">{teamInfo.website}</div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">Over</label>
                {isEditingTeam ? (
                  <textarea
                    value={teamInfo.about}
                    onChange={(e) => setTeamInfo({ ...teamInfo, about: e.target.value })}
                    rows={6}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <div className="w-full mt-1 text-gray-900 whitespace-pre-wrap">{teamInfo.about}</div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">Logo</label>
                <div className="mt-2">
                  <img src={teamInfo.logoUrl} alt="Team Logo" className="h-16" />
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Gebruik Cardan AI</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={teamInfo.useCardanAI}
                      onChange={(e) => setTeamInfo({ ...teamInfo, useCardanAI: e.target.checked })}
                      disabled={!isEditingTeam}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:bg-green-500 peer-checked:border-green-500 flex items-center justify-center">
                      {teamInfo.useCardanAI && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </label>
              </div>

              {isEditingTeam && (
                <button
                  onClick={saveTeamInfo}
                  className="w-full px-4 py-2 bg-shift2-primary text-white rounded-md hover:bg-shift2-primary-dark"
                >
                  Opslaan
                </button>
              )}
            </div>

            {/* Abonnement Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-semibold mb-4">Abonnement</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type abonnement</span>
                  <span className="font-medium">Pro</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Maximaal aantal onderzoeken</span>
                  <span>2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Resterende onderzoeken dit jaar</span>
                  <span>0</span>
                </div>
              </div>
            </div>

            {/* Functionaliteiten Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-semibold mb-4">Functionaliteiten</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Maximale bestandsgrootte</span>
                  <span>20 MB</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">Aanvullende onderzoeken</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">Pivot onderzoeken</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">Cardan Crawler</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">Notities</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">Projecten beheren</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">Opdrachtgevers beheren</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">Geschoondheidsfouten overschrijven</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">Cardan AI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Team Members */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Teamleden</h2>
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="new-user-button flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-green-500 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                Nieuwe gebruiker
              </button>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Naam</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                          {member.initials}
                        </div>
                        <span className="text-sm font-medium">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{member.status}</td>
                    <td className="px-4 py-3 text-right relative">
                      <button
                        onClick={() => setOpenMemberMenuId(openMemberMenuId === member.id ? null : member.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>

                      {openMemberMenuId === member.id && (
                        <div className="team-member-menu absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                          <button
                            onClick={() => {
                              setEditingMember(member);
                              setEditMemberFormData({
                                name: member.name,
                                email: member.email,
                                role: member.role,
                                language: 'Nederlands'
                              });
                              setShowEditMemberModal(true);
                              setOpenMemberMenuId(null);
                            }}
                            className="team-member-menu-item flex items-center w-full px-4 py-2 text-sm text-gray-700 gap-3 hover:bg-gray-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Bewerken
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Weet je zeker dat je ${member.name} wilt verwijderen?`)) {
                                const updatedMembers = teamMembers.filter(m => m.id !== member.id);
                                setTeamMembers(updatedMembers);
                                localStorage.setItem('teamMembers', JSON.stringify(updatedMembers));
                              }
                              setOpenMemberMenuId(null);
                            }}
                            className="team-member-menu-item-delete flex items-center w-full px-4 py-2 text-sm text-red-600 gap-3 hover:bg-gray-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Verwijderen
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Team Modal */}
      {showEditTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Team bewerken</h2>
                <button
                  onClick={() => setShowEditTeamModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const response = await fetch('/api/team', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(editTeamFormData),
                  });

                  if (response.ok) {
                    const updatedTeam = await response.json();
                    setTeamInfo(updatedTeam);
                    setShowEditTeamModal(false);
                    alert('Team informatie opgeslagen!');
                  } else {
                    alert('Fout bij opslaan van team informatie');
                  }
                } catch (error) {
                  console.error('Error saving team info:', error);
                  alert('Fout bij opslaan van team informatie');
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naam <span className="text-red-500">verplicht</span>
                  </label>
                  <input
                    type="text"
                    value={editTeamFormData.name}
                    onChange={(e) => setEditTeamFormData({ ...editTeamFormData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taal</label>
                  <select
                    value={editTeamFormData.language}
                    onChange={(e) => setEditTeamFormData({ ...editTeamFormData, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                  >
                    <option value="Nederlands">Nederlands</option>
                    <option value="English">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <textarea
                    value={editTeamFormData.address}
                    onChange={(e) => setEditTeamFormData({ ...editTeamFormData, address: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon</label>
                  <input
                    type="tel"
                    value={editTeamFormData.phone}
                    onChange={(e) => setEditTeamFormData({ ...editTeamFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={editTeamFormData.email}
                    onChange={(e) => setEditTeamFormData({ ...editTeamFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={editTeamFormData.website}
                    onChange={(e) => setEditTeamFormData({ ...editTeamFormData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tekst onderaan rapport</label>
                  <textarea
                    value={editTeamFormData.about}
                    onChange={(e) => setEditTeamFormData({ ...editTeamFormData, about: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                  />
                </div>

                <div>
                  <label className="flex items-center justify-between p-4 border border-gray-300 rounded-md">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Cardan AI</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Door deze functie in te schakelen, gaat u akkoord met de algemene voorwaarden van Cardan en OpenAI.
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={editTeamFormData.useCardanAI}
                        onChange={(e) => setEditTeamFormData({ ...editTeamFormData, useCardanAI: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors">
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${editTeamFormData.useCardanAI ? 'transform translate-x-5' : ''}`} />
                      </div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo (max. 20 MB)
                  </label>
                  <div className="flex items-center gap-4">
                    <img src={editTeamFormData.logoUrl} alt="Logo" className="h-16" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditTeamFormData({ ...editTeamFormData, logoUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-sm text-gray-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo (donker thema) (max. 20 MB)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                      FK
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="text-sm text-gray-600"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-shift2-primary text-white rounded-md hover:bg-shift2-primary-dark"
                  >
                    Opslaan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Nieuwe gebruiker</h2>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const initials = newMemberFormData.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2);

                const newMember: TeamMember = {
                  id: (teamMembers.length + 1).toString(),
                  name: newMemberFormData.name,
                  email: newMemberFormData.email,
                  role: newMemberFormData.role,
                  status: 'Actief',
                  initials: initials,
                  createdAt: new Date(),
                };

                const updatedMembers = [...teamMembers, newMember];
                setTeamMembers(updatedMembers);
                localStorage.setItem('teamMembers', JSON.stringify(updatedMembers));

                setNewMemberFormData({
                  name: '',
                  email: '',
                  role: 'Onderzoeker',
                  language: 'Nederlands'
                });
                setShowAddMemberModal(false);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naam <span className="text-red-500">verplicht</span>
                  </label>
                  <input
                    type="text"
                    value={newMemberFormData.name}
                    onChange={(e) => setNewMemberFormData({ ...newMemberFormData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail <span className="text-red-500">verplicht</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={newMemberFormData.email}
                      onChange={(e) => setNewMemberFormData({ ...newMemberFormData, email: e.target.value })}
                      required
                      placeholder="info@example.com"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    value={newMemberFormData.role}
                    onChange={(e) => setNewMemberFormData({ ...newMemberFormData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                  >
                    <option value="Onderzoeker">Onderzoeker</option>
                    <option value="Beheerder">Beheerder</option>
                    <option value="Controleur">Controleur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taal</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="Nederlands"
                        checked={newMemberFormData.language === 'Nederlands'}
                        onChange={(e) => setNewMemberFormData({ ...newMemberFormData, language: e.target.value })}
                        className="w-4 h-4 text-shift2-primary focus:ring-shift2-primary"
                      />
                      <span className="ml-2 text-sm text-gray-700">Nederlands</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="English"
                        checked={newMemberFormData.language === 'English'}
                        onChange={(e) => setNewMemberFormData({ ...newMemberFormData, language: e.target.value })}
                        className="w-4 h-4 text-shift2-primary focus:ring-shift2-primary"
                      />
                      <span className="ml-2 text-sm text-gray-700">English</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-shift2-primary text-white rounded-md hover:bg-shift2-primary-dark"
                  >
                    Opslaan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditMemberModal && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Gebruiker bewerken</h2>
                <button
                  onClick={() => setShowEditMemberModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const initials = editMemberFormData.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2);

                const updatedMembers = teamMembers.map(m =>
                  m.id === editingMember.id
                    ? {
                        ...m,
                        name: editMemberFormData.name,
                        email: editMemberFormData.email,
                        role: editMemberFormData.role,
                        initials: initials
                      }
                    : m
                );

                setTeamMembers(updatedMembers);
                localStorage.setItem('teamMembers', JSON.stringify(updatedMembers));
                setShowEditMemberModal(false);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naam <span className="text-red-500">verplicht</span>
                  </label>
                  <input
                    type="text"
                    value={editMemberFormData.name}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail <span className="text-red-500">verplicht</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={editMemberFormData.email}
                      onChange={(e) => setEditMemberFormData({ ...editMemberFormData, email: e.target.value })}
                      required
                      placeholder="info@example.com"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    value={editMemberFormData.role}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                  >
                    <option value="Onderzoeker">Onderzoeker</option>
                    <option value="Beheerder">Beheerder</option>
                    <option value="Controleur">Controleur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taal</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="Nederlands"
                        checked={editMemberFormData.language === 'Nederlands'}
                        onChange={(e) => setEditMemberFormData({ ...editMemberFormData, language: e.target.value })}
                        className="w-4 h-4 text-shift2-primary focus:ring-shift2-primary"
                      />
                      <span className="ml-2 text-sm text-gray-700">Nederlands</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="English"
                        checked={editMemberFormData.language === 'English'}
                        onChange={(e) => setEditMemberFormData({ ...editMemberFormData, language: e.target.value })}
                        className="w-4 h-4 text-shift2-primary focus:ring-shift2-primary"
                      />
                      <span className="ml-2 text-sm text-gray-700">English</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-shift2-primary text-white rounded-md hover:bg-shift2-primary-dark"
                  >
                    Opslaan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}