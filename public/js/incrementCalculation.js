$(document).ready(function () {
  $("#salaryInPercentage").keyup(function () {
    let salary = $("#currentSalary").val();
    let percentage = $("#salaryInPercentage").val();
    let answer = (salary / 100) * percentage;
    answer = Math.round(answer);
    $("#salaryInRupees").val(answer);
    const total = Number(salary) + Number(answer);
    $("#totalSalary").val(total);
  });

  $("#salaryInRupees").keyup(function () {
    let salary = $("#currentSalary").val();
    let rupees = $("#salaryInRupees").val();
    let answer = (rupees * 100) / salary;
    $("#salaryInPercentage").val(answer);
    const total = Number(salary) + Number(rupees);
    $("#totalSalary").val(total);
  });

  $("#salaryInPercentageUpdate").keyup(function () {
    let salary = $("#currentSalaryUpdate").val();
    let percentage = $("#salaryInPercentageUpdate").val();
    let answer = (salary / 100) * percentage;
    answer = Math.round(answer);
    $("#salaryInRupeesUpdate").val(answer);
    const total = Number(salary) + Number(answer);
    $("#totalSalaryUpdate").val(total);
  });

  $("#salaryInRupeesUpdate").keyup(function () {
    let salary = $("#currentSalaryUpdate").val();
    let rupees = $("#salaryInRupeesUpdate").val();
    let answer = (rupees * 100) / salary;
    $("#salaryInPercentageUpdate").val(answer);
    const total = Number(salary) + Number(rupees);
    $("#totalSalaryUpdate").val(total);
  });
});
