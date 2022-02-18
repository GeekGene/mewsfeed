import App from './Icon.svelte';

const expression = {
  author: 'unknown',
  timestamp: 'unknown',
  data: '{"feedMew":{"mew":{"mewType":{"original":null},"mew":{"mew":"creating a mew!"}},"header":{"type":"Create","author":{"type":"Buffer","data":[132,32,36,186,86,176,212,167,6,145,108,225,172,236,229,46,72,224,134,148,218,129,184,207,70,245,63,201,156,56,148,167,21,134,59,226,20,60,70]},"timestamp":1645074844495627,"header_seq":5,"prev_header":{"type":"Buffer","data":[132,41,36,235,154,154,117,54,170,234,91,126,69,140,99,147,170,115,238,38,123,240,254,76,113,233,53,148,148,150,27,128,199,247,194,230,243,127,204]},"entry_type":{"App":{"id":2,"zome_id":1,"visibility":{"Public":null}}},"entry_hash":{"type":"Buffer","data":[132,33,36,116,50,17,86,115,69,106,23,117,208,110,61,50,111,49,35,64,147,83,148,74,241,30,61,230,188,103,37,224,29,196,36,127,138,174,48]}}},"mewEntryHash":"uhCEkdDIRVnNFahd10G49Mm8xI0CTU5RK8R495rxnJeAdxCR_iq4w","comments":[],"shares":[],"likes":[]}',
  language: { address: 'QmcWWYnz494S2yucuZb3f1TczqfuAWjvNgRC3wZkB3mPqW' },
  proof: { valid: null, invalid: true }
}
const app = new App({
  target: document.body,
  props: {
    expression: expression,
  },
});

export default app;