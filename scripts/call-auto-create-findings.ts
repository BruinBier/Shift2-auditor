async function callAutoCreateFindings() {
  const scopeUrlId = '62573e58-c989-406b-895c-4e4ca1c70142'; // WOZ-waarde page
  const projectId = 'd0d6504f-e0f0-48c3-95a4-4e25df146fc1';

  console.log('Calling auto-create-findings API...\n');

  try {
    const response = await fetch(
      `http://localhost:3000/api/projects/${projectId}/scope-urls/${scopeUrlId}/auto-create-findings`,
      { method: 'POST' }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS!');
      console.log('');
      console.log(`Message: ${data.message}`);
      console.log(`Findings created: ${data.findingsCreated}`);
      console.log(`Findings updated: ${data.findingsUpdated}`);
      if (data.findingCodes && data.findingCodes.length > 0) {
        console.log(`Finding codes: ${data.findingCodes.join(', ')}`);
      }
    } else {
      console.log('❌ ERROR!');
      console.log('');
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error('❌ FETCH ERROR:', error);
  }
}

callAutoCreateFindings();
