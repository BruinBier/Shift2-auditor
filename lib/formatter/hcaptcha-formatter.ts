/**
 * Formatter for IframeIsHCaptchaTest results
 *
 * Formats hCaptcha accessibility test results into structured Dutch text
 * for inclusion in accessibility audit reports.
 */

export interface HCaptchaReport {
  bevinding: string;
  details: string;
  advies: string;
}

export function formatHCaptchaReport(testDetails: any): HCaptchaReport[] {
  const reports: HCaptchaReport[] = [];

  if (!testDetails?.issues || testDetails.issues.length === 0) {
    return reports;
  }

  // Group issues by reason
  const issuesByReason = new Map<string, any[]>();

  testDetails.issues.forEach((issue: any) => {
    const reason = issue.reason;
    if (!issuesByReason.has(reason)) {
      issuesByReason.set(reason, []);
    }
    issuesByReason.get(reason)!.push(issue);
  });

  // Create report for each reason group
  issuesByReason.forEach((issues, reason) => {
    let bevinding = '';
    let details = '';
    let advies = '';

    if (reason === 'Geen title attribuut') {
      bevinding = `Er ${issues.length === 1 ? 'is' : 'zijn'} ${issues.length} hCaptcha iframe${issues.length === 1 ? '' : 's'} gevonden zonder title-attribuut.`;

      details = `Ernst: Kritiek (WCAG 4.1.2 - Level A)\n\n`;
      details += `${issues.length === 1 ? 'Deze hCaptcha' : 'Deze hCaptcha\'s'} ${issues.length === 1 ? 'heeft' : 'hebben'} geen title-attribuut. `;
      details += `Gebruikers met een schermlezer krijgen geen informatie over het doel van de CAPTCHA, waardoor het onduidelijk is wat er van hen verwacht wordt.\n\n`;

      if (issues.length <= 3) {
        details += `Locatie${issues.length === 1 ? '' : 's'}:\n`;
        issues.forEach((issue: any, idx: number) => {
          const location = issue.location || 'Onbekend';
          details += `- ${location}\n`;
        });
      } else {
        details += `Voorbeelden (eerste 3 van ${issues.length}):\n`;
        issues.slice(0, 3).forEach((issue: any) => {
          const location = issue.location || 'Onbekend';
          details += `- ${location}\n`;
        });
      }

      advies = `Voeg een betekenisvol title-attribuut toe aan ${issues.length === 1 ? 'de' : 'alle'} hCaptcha iframe${issues.length === 1 ? '' : 's'}. `;
      advies += `Bijvoorbeeld:\n`;
      advies += `- "hCaptcha verificatie"\n`;
      advies += `- "Spam beschermingscontrole"\n`;
      advies += `- "Beveiligingsverificatie"\n\n`;
      advies += `De title moet duidelijk maken wat het doel is van de CAPTCHA en wat de gebruiker moet doen.`;

    } else if (reason === 'Title te kort/niet zinvol') {
      bevinding = `Er ${issues.length === 1 ? 'is' : 'zijn'} ${issues.length} hCaptcha iframe${issues.length === 1 ? '' : 's'} gevonden met een te korte of niet-zinvolle title.`;

      details = `Ernst: Kritiek (WCAG 4.1.2 - Level A)\n\n`;
      details += `${issues.length === 1 ? 'Deze hCaptcha heeft' : 'Deze hCaptcha\'s hebben'} wel een title-attribuut, maar de tekst is te kort (5 tekens of minder) of niet informatief. `;
      details += `Een goede title moet het doel van de CAPTCHA duidelijk maken.\n\n`;

      details += `Voorbeelden van gevonden titles:\n`;
      issues.slice(0, 3).forEach((issue: any) => {
        const titleText = issue.titleText || '(geen)';
        const location = issue.location || 'Onbekend';
        details += `- "${titleText}" (${location})\n`;
      });

      advies = `Vervang ${issues.length === 1 ? 'de' : 'deze'} korte of onduidelijke title${issues.length === 1 ? '' : 's'} door betekenisvolle tekst van minimaal 6 tekens. `;
      advies += `Bijvoorbeeld:\n`;
      advies += `- "hCaptcha verificatie"\n`;
      advies += `- "Beveiligingscontrole"\n`;
      advies += `- "Spam bescherming"\n\n`;
      advies += `Vermijd te korte teksten zoals "h", "captcha" of lege strings.`;

    } else if (reason === 'Niet toegankelijk voor toetsenbord') {
      bevinding = `Er ${issues.length === 1 ? 'is' : 'zijn'} ${issues.length} hCaptcha iframe${issues.length === 1 ? '' : 's'} gevonden die niet toegankelijk ${issues.length === 1 ? 'is' : 'zijn'} voor toetsenbordgebruikers.`;

      details = `Ernst: Kritiek (WCAG 4.1.2 - Level A)\n\n`;
      details += `${issues.length === 1 ? 'Deze hCaptcha is' : 'Deze hCaptcha\'s zijn'} niet bereikbaar met het toetsenbord door `;

      const hasTabindex = issues.some((i: any) => i.tabindex === '-1');
      const hasAriaHidden = issues.some((i: any) => i.ariaHidden === 'true');

      if (hasTabindex && hasAriaHidden) {
        details += `tabindex="-1" en/of aria-hidden="true" attributen. `;
      } else if (hasTabindex) {
        details += `tabindex="-1" attributen. `;
      } else if (hasAriaHidden) {
        details += `aria-hidden="true" attributen. `;
      }

      details += `Dit blokkeert gebruikers die afhankelijk zijn van toetsenbordnavigatie volledig, waardoor zij de website niet kunnen gebruiken.\n\n`;

      // Check if any are invisible variant
      const hasInvisible = issues.some((i: any) => i.isInvisible);
      if (hasInvisible) {
        details += `Let op: Sommige van deze hCaptcha's gebruiken de "invisible" variant, die automatisch wordt geactiveerd. Deze hoeven niet toetsenbordtoegankelijk te zijn.\n\n`;
      }

      details += `Problematische attributen:\n`;
      issues.slice(0, 3).forEach((issue: any) => {
        const location = issue.location || 'Onbekend';
        const attrs: string[] = [];
        if (issue.tabindex === '-1') attrs.push('tabindex="-1"');
        if (issue.ariaHidden === 'true') attrs.push('aria-hidden="true"');
        details += `- ${location}: ${attrs.join(', ')}\n`;
      });

      advies = `Verwijder tabindex="-1" en aria-hidden="true" attributen van ${issues.length === 1 ? 'de' : 'alle'} hCaptcha iframe${issues.length === 1 ? '' : 's'}. `;
      advies += `Als de hCaptcha "invisible" variant wordt gebruikt, is dit acceptabel omdat deze automatisch wordt geactiveerd zonder gebruikersinteractie. `;
      advies += `Voor zichtbare hCaptcha's moet het iframe bereikbaar zijn via Tab-toets en moet de CAPTCHA opgelost kunnen worden met alleen het toetsenbord.`;
    }

    reports.push({ bevinding, details, advies });
  });

  return reports;
}