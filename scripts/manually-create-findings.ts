async function manuallyCreateFindings() {
  const scopeUrlId = '62573e58-c989-406b-895c-4e4ca1c70142';
  const projectId = 'd0d6504f-e0f0-48c3-95a4-4e25df146fc1';

  console.log('Manually creating findings for WOZ-waarde page...\n');

  try {
    const response = await fetch(
      `http://localhost:3000/api/projects/${projectId}/scope-urls/${scopeUrlId}/auto-create-findings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', text);

    if (response.ok) {
      const data = JSON.parse(text);
      console.log('\n✅ SUCCESS!');
      console.log(`Message: ${data.message}`);
      console.log(`Findings created: ${data.findingsCreated}`);
      console.log(`Findings updated: ${data.findingsUpdated}`);
      if (data.findingCodes && data.findingCodes.length > 0) {
        console.log(`Finding codes: ${data.findingCodes.join(', ')}`);
      }
    } else {
      console.log('\n❌ ERROR!');
    }
  } catch (error) {
    console.error('\n❌ FETCH ERROR:', error);
  }
}

manuallyCreateFindings();
