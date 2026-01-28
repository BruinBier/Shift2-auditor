'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CrawlerTest {
  id: string;
  name: string;
  description: string;
  status: 'passing' | 'failing' | 'pending';
  category?: string;
  bevindingen?: string[];
}

const defaultTests: CrawlerTest[] = [
  { id: '1', name: 'IframeIsVimeoVideoWithKeysDisabledTest', description: 'Page has Vimeo video with keyboard disabled', status: 'pending' },
  { id: '2', name: 'ImgAltTooLongTest', description: 'Page has images with a very long alt-attribute value', status: 'pending', category: '1 premium bevinding' },
  { id: '3', name: 'ViewportMetaRestrictsScalingTest', description: 'Page has restrictions on scaling of the viewport', status: 'pending', category: '1 premium bevinding' },
  { id: '4', name: 'ImageLinkMissingAccessibleNameTest', description: 'Link with image without accessible name', status: 'pending' },
  { id: '5', name: 'PageContainsLinkReadMoreTest', description: 'Page contains links with "Read More"', status: 'pending' },
  { id: '6', name: 'PageContainsMultipleSameLinksTest', description: 'Page contains multiple links with the same link purpose', status: 'pending' },
  { id: '7', name: 'IframeMissingAccessibleNameTest', description: 'Page has iframe without an accessible name', status: 'pending', category: '2 snelle bevindingen' },
  { id: '8', name: 'IframeIsYouTubeVideoWithKeysEnabledTest', description: 'Page has YouTube video with single character keys enabled', status: 'pending', category: '1 premium bevinding' },
  { id: '9', name: 'TableWithHeadingsTest', description: 'Page has table with th-elements', status: 'pending' },
  { id: '10', name: 'TableTest', description: 'Page has table', status: 'pending' },
  { id: '11', name: 'IframeIsGoogleMapTest', description: 'Page has Google Maps', status: 'pending' },
  { id: '12', name: 'IframeIsScribitVideoTest', description: 'Page contains Scribit video', status: 'pending' },
  { id: '13', name: 'IframeIsVimeoVideoWithKeysEnabledTest', description: 'Page has Vimeo video with single character keys enabled', status: 'pending', category: '1 premium bevinding' },
  { id: '14', name: 'IframeIsVimeoVideoTest', description: 'Page has Vimeo video', status: 'pending' },
  { id: '15', name: 'IframeTest', description: 'Page has iframe', status: 'pending' },
  { id: '16', name: 'AudioHasAutoplayTest', description: 'Audio has autoplay', status: 'pending' },
  { id: '17', name: 'AudioControlsTest', description: 'Page has audio with controls', status: 'pending' },
  { id: '18', name: 'AudioTest', description: 'Page has audio', status: 'pending' },
  { id: '19', name: 'VideoHasAutoplayTest', description: 'Video has autoplay', status: 'pending' },
  { id: '20', name: 'VideoMissingTitleAriaTest', description: 'Video-element with controls does not have an accessible name', status: 'pending' },
  { id: '21', name: 'PageContainsWordsTest', description: 'Sensory Characteristics exists', status: 'pending' },
  { id: '22', name: 'LabelMissingForTest', description: 'Page has label-element without for-attribute', status: 'pending' },
  { id: '23', name: 'IframeIsVimeoVideoTest', description: 'Page has Vimeo video', status: 'pending' },
  { id: '24', name: 'VideoControlsTest', description: 'Page has video with controls', status: 'pending' },
  { id: '25', name: 'VideoMissingTitleAriaTest', description: 'Video-element with controls does not have an accessible name', status: 'pending' },
  { id: '26', name: 'VideoHasAutoplayTest', description: 'Video has autoplay', status: 'pending' },
  { id: '27', name: 'AudioTest', description: 'Page has audio', status: 'pending' },
  { id: '28', name: 'AudioControlsTest', description: 'Page has audio with controls', status: 'pending' },
  { id: '29', name: 'AudioMissingTitleAriaTest', description: 'Audio-element with controls does not have an accessible name', status: 'pending' },
  { id: '30', name: 'AudioHasAutoplayTest', description: 'Audio has autoplay', status: 'pending' },
  { id: '31', name: 'IframeTest', description: 'Page has iframe', status: 'pending' },
  { id: '32', name: 'IframeIsYouTubeVideoWithKeysEnabledTest', description: 'Page has YouTube video with single character keys enabled', status: 'pending', category: '1 premium bevinding' },
  { id: '33', name: 'AudioHasAutoplayTest', description: 'Audio has autoplay', status: 'pending' },
  { id: '34', name: 'IframeTest', description: 'Page has iframe', status: 'pending' },
  { id: '35', name: 'IframeIsYouTubeVideoWithKeysEnabledTest', description: 'Page has YouTube video with single character keys enabled', status: 'pending', category: '1 premium bevinding' },
  { id: '36', name: 'IframeIsVimeoVideoTest', description: 'Page has Vimeo video', status: 'pending' },
  { id: '37', name: 'IframeIsVimeoVideoWithKeysEnabledTest', description: 'Page has Vimeo video with single character keys enabled', status: 'pending', category: '1 premium bevinding' },
  { id: '38', name: 'IframeIsScribitVideoTest', description: 'Page contains Scribit video', status: 'pending' },
  { id: '39', name: 'IframeIsGoogleMapTest', description: 'Page has Google Maps', status: 'pending' },
  { id: '40', name: 'ListTest', description: 'Page has list', status: 'pending' },
  { id: '41', name: 'TableTest', description: 'Page has table', status: 'pending' },
  { id: '42', name: 'TableWithHeadingsTest', description: 'Page has table with th-elements', status: 'pending' },
  { id: '43', name: 'TableWithEmptyHeadingsTest', description: 'Page has table with empty th-elements', status: 'pending' },
  { id: '44', name: 'PageContainsWordsTest', description: 'Sensory Characteristics exists', status: 'pending' },
  { id: '45', name: 'FormTest', description: 'Page has form', status: 'pending' },
  { id: '46', name: 'VideoMissingTitleAriaTest', description: 'Video-element with controls does not have an accessible name', status: 'pending' },
  { id: '47', name: 'VideoControlsTest', description: 'Page has video with controls', status: 'pending' },
  { id: '48', name: 'StrongHasMoreThanFourWordsTest', description: 'Page has strong-element with more than 4 words', status: 'pending' },
  { id: '49', name: 'InvalidListFormatTest', description: 'Page has invalid list', status: 'pending' },
  { id: '50', name: 'ListDLItemInvalidParentTest', description: 'Description list items are not inside a description list', status: 'pending' },
  { id: '51', name: 'ListDLInvalidGroupChildrenTest', description: 'Page has description list with invalid children within div group', status: 'pending' },
  { id: '52', name: 'ListDLInvalidChildrenTest', description: 'Page has description list with invalid children', status: 'pending' },
  { id: '53', name: 'ListDescriptionListTest', description: 'Page has description list', status: 'pending' },
  { id: '54', name: 'ListLIInvalidParentTest', description: 'List item does not belong to a list', status: 'pending' },
  { id: '55', name: 'ListInvalidChildItemTest', description: 'Page has a list with invalid children / items', status: 'pending' },
  { id: '56', name: 'ListTest', description: 'Page has list', status: 'pending' },
  { id: '57', name: 'EmHasMoreThanFourWordsTest', description: 'Page has em-element with more then 4 words', status: 'pending' },
  { id: '58', name: 'LangAttributeInvalidTest', description: 'Page has invalid value for lang-attribute on the HTML element', status: 'pending', category: '1 premium bevinding' },
  { id: '59', name: 'FormNovalidateTest', description: 'Form with required input fields is validated by browser', status: 'pending' },
  { id: '60', name: 'AutocompleteInvalidTokenTest', description: 'Autocomplete attribute contains unknown value', status: 'pending' },
  { id: '61', name: 'FormInputsHaveAutocompleteTest', description: 'Page has form with inputs containing autocomplete', status: 'pending' },
  { id: '62', name: 'LabelIncorrectForTest', description: 'Label element has incorrect value for for-attribute', status: 'pending' },
  { id: '63', name: 'LabelForMissingElementTest', description: 'Page has a label element which is not correctly connected to an input field', status: 'pending' },
  { id: '64', name: 'LabelMissingForTest', description: 'Page has label-element without for-attribute', status: 'pending' },
  { id: '65', name: 'FormMissingLabelsTest', description: 'Page has form without label-elements', status: 'pending' },
  { id: '66', name: 'PageContainsExpressionsTest', description: 'The page contains one of the following expressions ...', status: 'pending' },
  { id: '67', name: 'AutoRefreshTest', description: 'Page refreshes automatically', status: 'pending' },
  { id: '68', name: 'LangInContentTest', description: 'Page contains content marked with lang-attribute', status: 'pending' },
  { id: '69', name: 'AriaCurrentTest', description: 'Page has elements with aria-current', status: 'pending' },
  { id: '70', name: 'AriaExpandedTest', description: 'Page has elements with aria-expanded', status: 'pending' },
  { id: '71', name: 'AriaSelectedTest', description: 'Page has elements with aria-selected', status: 'pending' },
  { id: '72', name: 'AriaControlsTest', description: 'Page has elements with aria-controls', status: 'pending' },
  { id: '73', name: 'AriaDescribedbyTest', description: 'Page has elements with aria-describedby', status: 'pending' },
  { id: '74', name: 'AriaPressedTest', description: 'Page has elements with aria-pressed', status: 'pending' },
  { id: '75', name: 'AriaLabelTest', description: 'Page has elements with aria-label', status: 'pending' },
  { id: '76', name: 'AriaLabelledbyTest', description: 'Page has elements with aria-labelledby', status: 'pending' },
  { id: '77', name: 'AriaAnnouncementsTest', description: 'Page has element with aria-live="polite", role="status"', status: 'pending' },
  { id: '78', name: 'FieldsetWithoutLegendTest', description: 'Page has fieldset without legend', status: 'pending' },
  { id: '79', name: 'LegendEmptyTest', description: 'Page has an empty legend element', status: 'pending' },
  { id: '80', name: 'PageIsRijksoverheidTest', description: 'Page is Platform Rijksoverheid (PRO)', status: 'pending' },
  { id: '81', name: 'PageIsWordpressTest', description: 'Page is most likely WordPress', status: 'pending' },
  { id: '82', name: 'PageIsTypo3Test', description: 'Page is TYPO3 CMS', status: 'pending' },
  { id: '83', name: 'PageIsSimSiteTest', description: 'Page is SIM Group', status: 'pending' },
  { id: '84', name: 'CookiebotTest', description: 'Page contains Cookiebot', status: 'pending' },
  { id: '85', name: 'ReadSpeakerTest', description: 'Page contains ReadSpeaker', status: 'pending' },
  { id: '86', name: 'SlickSliderTest', description: 'Page contains most likely a Slick slider (carrousel)', status: 'pending' },
  { id: '87', name: 'DigiDTest', description: 'Page referers to DigiD, check if DigiD is part of a proces on this page', status: 'pending' },
  { id: '88', name: 'EHerkenningTest', description: 'Page refers to eHerkenning, check if eHerkenning is part of a process on this page', status: 'pending' },
  { id: '89', name: 'ReCaptchaTest', description: 'Page contains recaptcha', status: 'pending' },
  { id: '90', name: 'PageIsDrupalTest', description: 'Page is Drupal', status: 'pending' },
  { id: '91', name: 'ChatbotTest', description: 'Page has chatbot', status: 'pending' },
  { id: '92', name: 'UsabillaTest', description: 'Page has Usabilla Feedback (GetFeedback)', status: 'pending' },
  { id: '93', name: 'PageIsIproxNetTest', description: 'Page uses IPROX CMS', status: 'pending' },
  { id: '94', name: 'PageIsUmbracoTest', description: 'Page uses Umbraco', status: 'pending' },
  { id: '95', name: 'PageIsJoomlaTest', description: 'Page uses Joomla', status: 'pending' },
  { id: '96', name: 'LinkIsHelpTest', description: 'Page contains links which most likely leads to help', status: 'pending' },
  { id: '97', name: 'LinkIsPDFTest', description: 'Page contains PDF links', status: 'pending' },
  { id: '98', name: 'LinkIsMP4Test', description: 'Page contains MPEG-4 video links', status: 'pending' },
  { id: '99', name: 'LinkIsMP3Test', description: 'Page contains MP3 links', status: 'pending' },
  { id: '100', name: 'LinkIsSRTTest', description: 'Page contains SRT links', status: 'pending' },
  { id: '101', name: 'LinkIsPictureTest', description: 'Page contains Picture links', status: 'pending' },
  { id: '102', name: 'IframeIsYouTubeVideoTest', description: 'Page has YouTube video', status: 'pending' },
  { id: '103', name: 'IframeIsYouTubeVideoWithKeysDisabledTest', description: 'Page has YouTube video with keyboard disabled', status: 'pending' },
  { id: '104', name: 'VideoTest', description: 'Page has video', status: 'pending' },
  { id: '105', name: 'VideoHasCaptionsTest', description: 'Video has captions', status: 'pending' },
  { id: '106', name: 'BreadcrumbsTest', description: 'Page has breadcrumbs', status: 'pending' },
  { id: '107', name: 'SkipToContentTest', description: 'Page has skip to content link', status: 'pending' },
  { id: '108', name: 'LinkFocusVisibleTest', description: 'Links have visible focus indicator', status: 'pending' },
  { id: '109', name: 'ButtonFocusVisibleTest', description: 'Buttons have visible focus indicator', status: 'pending' },
  { id: '110', name: 'InputFocusVisibleTest', description: 'Input fields have visible focus indicator', status: 'pending' },
  { id: '111', name: 'HeadingStructureTest', description: 'Page has proper heading structure', status: 'pending' },
  { id: '112', name: 'H1Test', description: 'Page has H1 heading', status: 'pending' },
  { id: '113', name: 'LandmarksTest', description: 'Page uses HTML5 landmarks', status: 'pending' },
  { id: '114', name: 'NavElementTest', description: 'Page has nav element', status: 'pending' },
  { id: '115', name: 'MainElementTest', description: 'Page has main element', status: 'pending' },
  { id: '116', name: 'FooterElementTest', description: 'Page has footer element', status: 'pending' },
  { id: '117', name: 'LinkTextTest', description: 'Links have descriptive text', status: 'pending' },
  { id: '118', name: 'ButtonTextTest', description: 'Buttons have descriptive text', status: 'pending' },
  { id: '119', name: 'ImageAltTest', description: 'Images have alt attributes', status: 'pending' },
  { id: '120', name: 'DecorativeImageTest', description: 'Decorative images have empty alt', status: 'pending' },
  { id: '121', name: 'ColorContrastTest', description: 'Text has sufficient color contrast', status: 'pending' },
  { id: '122', name: 'FontSizeTest', description: 'Font size is readable', status: 'pending' },
  { id: '123', name: 'ResponsiveDesignTest', description: 'Page is responsive', status: 'pending' },
  { id: '124', name: 'TouchTargetSizeTest', description: 'Touch targets are large enough', status: 'pending' },
  { id: '125', name: 'FormValidationTest', description: 'Form has validation messages', status: 'pending' },
  { id: '126', name: 'RequiredFieldsTest', description: 'Required fields are indicated', status: 'pending' },
  { id: '127', name: 'ErrorMessagesTest', description: 'Error messages are clear', status: 'pending' },
  { id: '128', name: 'SuccessMessagesTest', description: 'Success messages are provided', status: 'pending' },
  { id: '129', name: 'LoadingIndicatorTest', description: 'Loading states are indicated', status: 'pending' },
];

export default function CrawlerTestsPage() {
  const [mounted, setMounted] = useState(false);
  const [showBeheerMenu, setShowBeheerMenu] = useState(false);
  const [tests, setTests] = useState<CrawlerTest[]>(defaultTests);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showModal, setShowModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<CrawlerTest | null>(null);
  const [activeTab, setActiveTab] = useState<'snelle' | 'premium'>('premium');
  const [selectedBevindingen, setSelectedBevindingen] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load tests from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTests = localStorage.getItem('crawlerTests');
    if (savedTests) {
      try {
        setTests(JSON.parse(savedTests));
      } catch (error) {
        console.error('Error loading tests from localStorage:', error);
      }
    }
  }, []);

  // Save tests to localStorage whenever they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('crawlerTests', JSON.stringify(tests));
    }
  }, [tests, mounted]);

  // Close Beheer menu on Escape key or click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowBeheerMenu(false);
        setShowDropdown(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showBeheerMenu && !target.closest('.beheer-button') && !target.closest('.beheer-menu')) {
        setShowBeheerMenu(false);
      }
      if (showDropdown && !target.closest('.bevindingen-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBeheerMenu, showDropdown]);

  const filteredTests = selectedCategory === 'all'
    ? tests
    : tests.filter(t => t.category === selectedCategory);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTests = filteredTests.slice(startIndex, endIndex);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

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
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3.58-.51 5.07-1.39l3.63 3.63c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-3.63-3.63C19.51 17.58 20 15.85 20 14c0-5.52-4.48-10-10-10zm0 2c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8zm3.5 5h-2.2c-.14-.54-.32-1.05-.54-1.52 1.16.46 2.14 1.22 2.74 2.52zm-3.5 7c-.44-.62-.81-1.3-1.09-2h2.18c-.28.7-.65 1.38-1.09 2zM6.26 13C6.1 12.36 6 11.69 6 11s.1-1.36.26-2h2.71c-.07.66-.11 1.32-.11 2s.04 1.34.11 2H6.26zm.85 2h2.2c.14.54.32 1.05.54 1.52-1.16-.46-2.14-1.22-2.74-2.52zm2.2-6H7.11c.6-1.3 1.58-2.06 2.74-2.52-.22.47-.4.98-.54 1.52zm3.78 9c.44-.62.81-1.3 1.09-2h-2.18c.28.7.65 1.38 1.09 2zm1.41-4h-4c-.07-.66-.11-1.32-.11-2s.04-1.34.11-2h4c.07.66.11 1.32.11 2s-.04 1.34-.11 2z"/>
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
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3.58-.51 5.07-1.39l3.63 3.63c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-3.63-3.63C19.51 17.58 20 15.85 20 14c0-5.52-4.48-10-10-10zm0 2c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8zm3.5 5h-2.2c-.14-.54-.32-1.05-.54-1.52 1.16.46 2.14 1.22 2.74 2.52zm-3.5 7c-.44-.62-.81-1.3-1.09-2h2.18c-.28.7-.65 1.38-1.09 2zM6.26 13C6.1 12.36 6 11.69 6 11s.1-1.36.26-2h2.71c-.07.66-.11 1.32-.11 2s.04 1.34.11 2H6.26zm.85 2h2.2c.14.54.32 1.05.54 1.52-1.16-.46-2.14-1.22-2.74-2.52zm2.2-6H7.11c.6-1.3 1.58-2.06 2.74-2.52-.22.47-.4.98-.54 1.52zm3.78 9c.44-.62.81-1.3 1.09-2h-2.18c.28.7.65 1.38 1.09 2zm1.41-4h-4c-.07-.66-.11-1.32-.11-2s.04-1.34.11-2h4c.07.66.11 1.32.11 2s-.04 1.34-.11 2z"/>
            </svg>
            Crawler tests ({filteredTests.length})
          </h1>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Volgorde</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-shift2-primary min-w-[200px]"
              >
                <option value="all">Datum aangemaakt</option>
                <option value="recent">Laatst gewijzigd</option>
                <option value="name">Naam</option>
                <option value="impact">Impact</option>
              </select>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="relative mt-6">
                <input
                  type="text"
                  placeholder="zoeken"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-shift2-primary pr-10"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black text-white rounded hover:bg-gray-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tests Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschrijving</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gekoppelde bevindingen</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedTests.map((test) => (
                <tr key={test.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{test.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{test.description}</td>
                  <td className="px-6 py-4 text-sm">
                    {test.bevindingen && test.bevindingen.length > 0 ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                        {test.bevindingen.length} premium bevinding{test.bevindingen.length !== 1 ? 'en' : ''}
                      </span>
                    ) : (
                      test.category && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {test.category}
                        </span>
                      )
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* Settings/Gear button */}
                      <button
                        type="button"
                        className="action-button p-2 text-gray-600 rounded"
                        title="Instellingen"
                        onClick={() => {
                          setSelectedTest(test);
                          setSelectedBevindingen(test.bevindingen || []);
                          setShowModal(true);
                        }}
                        style={{ backgroundColor: 'transparent', color: '#4b5563' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                          e.currentTarget.style.color = '#1f2937';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#4b5563';
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      {/* Arrow/Open button */}
                      <Link href={`/admin/crawler-tests/${test.id}`}>
                        <button
                          type="button"
                          className="action-button p-2 text-gray-600 rounded"
                          title="Openen"
                          style={{ backgroundColor: 'transparent', color: '#4b5563' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                            e.currentTarget.style.color = '#1f2937';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#4b5563';
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
            {/* Left side - Total items */}
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(endIndex, filteredTests.length)} van {filteredTests.length}
            </div>

            {/* Center - Navigation controls */}
            <div className="flex items-center gap-4">
              {/* First page button */}
              <button
                type="button"
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="pagination-button px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'white' }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                «
              </button>

              {/* Previous page button */}
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="pagination-button px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'white' }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                ‹
              </button>

              {/* Page indicator */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page);
                    }
                  }}
                  className="w-16 px-2 py-1 bg-white border border-gray-300 rounded text-sm text-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                  min="1"
                  max={totalPages}
                />
                <span className="text-sm text-gray-600">van {totalPages}</span>
              </div>

              {/* Next page button */}
              <button
                type="button"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="pagination-button px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'white' }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                ›
              </button>

              {/* Last page button */}
              <button
                type="button"
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="pagination-button px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'white' }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                »
              </button>
            </div>

            {/* Right side - Items per page selector */}
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-shift2-primary"
            >
              <option value={20}>20 items per pagina</option>
              <option value={50}>50 items per pagina</option>
              <option value={100}>100 items per pagina</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modal voor crawler test bevindingen */}
      {showModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Crawler test bevindingen</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Tabs */}
              <div className="flex gap-4 border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('snelle')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'snelle'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Snelle bevindingen
                </button>
                <button
                  onClick={() => setActiveTab('premium')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'premium'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Premium bevindingen
                </button>
              </div>

              {/* Custom Dropdown */}
              <div className="mb-4 relative bevindingen-dropdown">
                {/* Input field that opens dropdown */}
                <div
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-shift2-primary bg-white"
                >
                  <span className="text-gray-500">
                    {activeTab === 'snelle'
                      ? 'Kies een of meerdere snelle bevindingen'
                      : 'Kies een of meerdere premium bevindingen'}
                  </span>
                </div>

                {/* Dropdown list */}
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {activeTab === 'snelle' ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        De lijst is leeg
                      </div>
                    ) : (
                      <div>
                        <div
                          className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            if (!selectedBevindingen.includes('pdf-titel-niet-getoond')) {
                              setSelectedBevindingen([...selectedBevindingen, 'pdf-titel-niet-getoond']);
                              setShowDropdown(false);
                            }
                          }}
                        >
                          PDF - Titel niet getoond
                        </div>
                        <div
                          className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            if (!selectedBevindingen.includes('tekstalternatief')) {
                              setSelectedBevindingen([...selectedBevindingen, 'tekstalternatief']);
                              setShowDropdown(false);
                            }
                          }}
                        >
                          Tekstalternatief met &quot;Afbeelding van...&quot;
                        </div>
                        <div
                          className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            if (!selectedBevindingen.includes('zichtbare-tekst-link')) {
                              setSelectedBevindingen([...selectedBevindingen, 'zichtbare-tekst-link']);
                              setShowDropdown(false);
                            }
                          }}
                        >
                          Zichtbare tekst link niet in aria-label
                        </div>
                        <div
                          className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            if (!selectedBevindingen.includes('vimeo-keyboard')) {
                              setSelectedBevindingen([...selectedBevindingen, 'vimeo-keyboard']);
                              setShowDropdown(false);
                            }
                          }}
                        >
                          Vimeo keyboard=0 ontbreekt
                        </div>
                        <div
                          className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            if (!selectedBevindingen.includes('pdf-afbeeldingen')) {
                              setSelectedBevindingen([...selectedBevindingen, 'pdf-afbeeldingen']);
                              setShowDropdown(false);
                            }
                          }}
                        >
                          PDF - Afbeeldingen niet-getagde PDF
                        </div>
                        <div
                          className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            if (!selectedBevindingen.includes('paginatitel-leeg')) {
                              setSelectedBevindingen([...selectedBevindingen, 'paginatitel-leeg']);
                              setShowDropdown(false);
                            }
                          }}
                        >
                          Paginatitel is leeg
                        </div>
                        <div
                          className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            if (!selectedBevindingen.includes('alt-bestandsnaam')) {
                              setSelectedBevindingen([...selectedBevindingen, 'alt-bestandsnaam']);
                              setShowDropdown(false);
                            }
                          }}
                        >
                          Alt met bestandsnaam (min-tekens, underscore)
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected bevindingen list */}
              {selectedBevindingen.length > 0 && (
                <div className="mb-4 space-y-2">
                  {selectedBevindingen.map((bevinding) => {
                    const bevindingLabels: { [key: string]: string } = {
                      'pdf-titel-niet-getoond': 'PDF - Titel niet getoond',
                      'tekstalternatief': 'Tekstalternatief met "Afbeelding van..."',
                      'zichtbare-tekst-link': 'Zichtbare tekst link niet in aria-label',
                      'vimeo-keyboard': 'Vimeo keyboard=0 ontbreekt',
                      'pdf-afbeeldingen': 'PDF - Afbeeldingen niet-getagde PDF',
                      'paginatitel-leeg': 'Paginatitel is leeg',
                      'alt-bestandsnaam': 'Alt met bestandsnaam (min-tekens, underscore)'
                    };

                    return (
                      <div key={bevinding} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-700">{bevindingLabels[bevinding]}</span>
                        <button
                          onClick={() => {
                            setSelectedBevindingen(selectedBevindingen.filter(b => b !== bevinding));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Info text */}
              <p className="text-sm text-gray-600 mb-6">
                Je kunt meerdere snelle en premium bevindingen koppelen aan een crawler test.
              </p>

              {/* Save Button */}
              <button
                type="button"
                className="modal-save-button w-full px-4 py-2 text-white text-sm rounded-md"
                onClick={() => {
                  if (selectedTest) {
                    // Update the tests array with the new bevindingen
                    const updatedTests = tests.map(t =>
                      t.id === selectedTest.id
                        ? { ...t, bevindingen: selectedBevindingen }
                        : t
                    );
                    setTests(updatedTests);
                  }
                  setShowModal(false);
                }}
              >
                Wijzigingen opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}